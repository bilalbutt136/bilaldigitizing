-- ============================================================
-- B Digitizing & Vector Studio — Production Database Schema
-- Run in Supabase SQL Editor (Dashboard > SQL Editor) or via `supabase db push`
--
-- SAFE TO RUN MULTIPLE TIMES and safe against the existing live schema
-- (database/Live_schema_dump.sql): old permissive policies are dropped,
-- missing user_id columns are added, and all objects use IF NOT EXISTS.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- RECONCILE EXISTING LIVE TABLES (no-op on a fresh database)
-- The previous live schema had public read/write policies and no
-- user_id column. These statements bring it in line with the new
-- production schema before RLS policies are applied below.
-- ============================================================

-- Add user_id linkage columns if they do not already exist
alter table public.clients add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.order_files add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.transactions add column if not exists user_id uuid references auth.users (id) on delete set null;

-- Drop the old permissive RLS policies inherited from the demo era
drop policy if exists "Allow public read/write on clients" on public.clients;
drop policy if exists "Allow public read/write on order_files" on public.order_files;
drop policy if exists "Allow public read/write on orders" on public.orders;
drop policy if exists "Allow public read/write on revisions" on public.revisions;
drop policy if exists "Allow public read/write on transactions" on public.transactions;
drop policy if exists "Public Read/Write Client Uploads" on storage.objects;
drop policy if exists "Public Read/Write Finished Packages" on storage.objects;

-- ============================================================
-- ADMIN ROLE HELPERS
-- Admins are granted access by inserting their email into public.admins.
-- This is managed server-side (service role) via /api/admin route handlers,
-- so no credentials or email addresses are ever hardcoded in the client.
-- ============================================================

-- Current authenticated user's email (lowercased), or NULL
create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower((auth.jwt() ->> 'email'))
$$;


-- ============================================================
-- ADMINS
-- ============================================================-- ADMINS TABLE
create table if not exists public.admins (
  email text primary key,
  name text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4b. is_admin() function (depends on admins table)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_email() in (
    select lower(email) from public.admins
  )
$$;


-- ============================================================
-- CATALOG TABLES (public read, admin write)
-- ============================================================

-- SERVICES
create table if not exists public.services (
  id text primary key,
  title text not null,
  price text,
  stitches text,
  time text,
  icon text,
  route text,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRICING CARDS (embroidery)
create table if not exists public.pricing_cards (
  id text primary key,
  category text not null default 'embroidery',
  title text not null,
  rate text,
  unit text,
  badge text,
  popular boolean not null default false,
  highlight boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PATCH CARDS
create table if not exists public.patch_cards (
  id text primary key,
  title text not null,
  rate text,
  unit text,
  badge text,
  popular boolean not null default false,
  highlight boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STORE PRODUCTS
create table if not exists public.store_products (
  id text primary key,
  category text,
  title text not null,
  price text,
  unit text,
  min_quantity integer,
  badge text,
  status text not null default 'active',
  image text,
  description text,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PORTFOLIO SAMPLES
create table if not exists public.portfolio (
  id text primary key,
  title text,
  category text,
  stitch_count text,
  colors text,
  original_image text,
  digitized_image text,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SEW OUTS
create table if not exists public.sew_outs (
  id text primary key,
  title text,
  category text,
  before_img text,
  after_img text,
  stitch_count text,
  formats text,
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HERO SLIDES
create table if not exists public.hero_slides (
  id text primary key,
  service_key text,
  badge text,
  title text not null,
  highlight text,
  description text,
  rate_label text,
  primary_cta text,
  secondary_cta text,
  banner_image text,
  trust_points jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DIGITIZERS
create table if not exists public.digitizers (
  id text primary key,
  name text not null,
  role text,
  rating numeric,
  active_jobs integer not null default 0,
  avatar text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- USERS / CLIENTS
-- ============================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text,
  full_name text,
  email text not null unique,
  company text,
  company_name text,
  role text not null default 'customer',
  wallet_balance numeric not null default 0,
  orders_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_email_idx on public.clients (email);
create index if not exists clients_user_id_idx on public.clients (user_id);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  title text,
  description text,
  type text,
  client_id text,
  client_name text,
  client_email text,
  service_category text,
  service_type text,
  placement_type text,
  fabric_type text,
  dimensions jsonb,
  estimated_stitches integer,
  colors_count integer,
  requested_formats text[] not null default array['dst','pes','emb','pdf'],
  is_rush boolean not null default false,
  is_store_item boolean not null default false,
  quantity integer,
  backing text,
  border_type text,
  price numeric not null default 0,
  cost numeric not null default 0,
  payment_status text not null default 'Pending',
  notes text,
  artwork_url text,
  image_url text,
  logo text,
  status text not null default 'submitted',
  output_file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_client_email_idx on public.orders (client_email);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ORDER FILES
create table if not exists public.order_files (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  file_name text,
  file_format text,
  file_type text,
  bucket_name text,
  file_path text,
  file_url text,
  public_url text,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists order_files_order_id_idx on public.order_files (order_id);

-- REVISIONS
create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders (id) on delete cascade,
  requested_by text,
  note text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists revisions_order_id_idx on public.revisions (order_id);

-- ORDER MESSAGES (chat between client and studio)
create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders (id) on delete cascade,
  sender text,
  sender_role text not null default 'client',
  text text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_messages_order_id_idx on public.order_messages (order_id);

-- TRANSACTIONS (wallet ledger)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  client_email text,
  type text,
  amount numeric not null default 0,
  payment_method text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_client_email_idx on public.transactions (client_email);

-- ============================================================
-- SITE CONFIG (CMS key/value store)
-- ============================================================
create table if not exists public.site_config (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INVOICES (BoltPayouts)
-- ============================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  client_email text,
  amount numeric not null,
  method text,
  status text not null default 'pending',
  bolt_order_id text,
  payment_url text,
  reference_id text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_client_email_idx on public.invoices (client_email);

-- ============================================================
-- RECEIPTS (BoltPayouts)
-- ============================================================
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  client_email text,
  amount numeric not null,
  method text,
  bolt_order_id text,
  transaction_id uuid references public.transactions (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists receipts_client_email_idx on public.receipts (client_email);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.services enable row level security;
alter table public.pricing_cards enable row level security;
alter table public.patch_cards enable row level security;
alter table public.store_products enable row level security;
alter table public.portfolio enable row level security;
alter table public.sew_outs enable row level security;
alter table public.hero_slides enable row level security;
alter table public.digitizers enable row level security;
alter table public.site_config enable row level security;
alter table public.admins enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_files enable row level security;
alter table public.revisions enable row level security;
alter table public.order_messages enable row level security;
alter table public.transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.receipts enable row level security;

-- Catalog read for everyone (anon + authenticated)
create policy catalog_read_all on public.services for select using (true);
create policy catalog_read_all on public.pricing_cards for select using (true);
create policy catalog_read_all on public.patch_cards for select using (true);
create policy catalog_read_all on public.store_products for select using (true);
create policy catalog_read_all on public.portfolio for select using (true);
create policy catalog_read_all on public.sew_outs for select using (true);
create policy catalog_read_all on public.hero_slides for select using (true);
create policy catalog_read_all on public.digitizers for select using (true);

-- Catalog write for admins only
create policy catalog_admin_write on public.services for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_admin_write on public.pricing_cards for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_admin_write on public.patch_cards for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_admin_write on public.store_products for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_admin_write on public.portfolio for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_admin_write on public.sew_outs for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_admin_write on public.hero_slides for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_admin_write on public.digitizers for all using (public.is_admin()) with check (public.is_admin());

-- site_config: public read, admin write
create policy site_config_read_all on public.site_config for select using (true);
create policy site_config_admin_write on public.site_config for all using (public.is_admin()) with check (public.is_admin());

-- admins table: readable by admins (service role manages writes)
create policy admins_read_only on public.admins for select using (public.is_admin());
create policy admins_admin_write on public.admins for all using (public.is_admin()) with check (public.is_admin());

-- clients: users manage their own profile, admins manage all.
-- No anon/authenticated INSERT here — signups are written by the service role
-- via the /api route handlers so wallet_balance can never be spoofed.
create policy clients_select_own on public.clients for select using (
  lower(email) = public.current_user_email() or public.is_admin()
);
create policy clients_update_own on public.clients for update using (
  lower(email) = public.current_user_email() or public.is_admin()
) with check (
  lower(email) = public.current_user_email() or public.is_admin()
);

-- orders: users manage their own orders, admins manage all
create policy orders_select_own on public.orders for select using (
  user_id = auth.uid() or lower(client_email) = public.current_user_email() or public.is_admin()
);
create policy orders_insert_own on public.orders for insert with check (
  (user_id = auth.uid() and lower(client_email) = public.current_user_email()) or public.is_admin()
);
create policy orders_update_own on public.orders for update using (
  user_id = auth.uid() or lower(client_email) = public.current_user_email() or public.is_admin()
) with check (
  (user_id = auth.uid() and lower(client_email) = public.current_user_email()) or public.is_admin()
);
create policy orders_delete_own on public.orders for delete using (
  user_id = auth.uid() or lower(client_email) = public.current_user_email() or public.is_admin()
);

-- order_files: accessible when the parent order is accessible
create policy order_files_select_own on public.order_files for select using (
  public.is_admin() or exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or lower(o.client_email) = public.current_user_email())
  )
);
create policy order_files_insert_own on public.order_files for insert with check (
  public.is_admin() or exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or lower(o.client_email) = public.current_user_email())
  )
);

-- revisions: accessible when the parent order is accessible
create policy revisions_select_own on public.revisions for select using (
  public.is_admin() or exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or lower(o.client_email) = public.current_user_email())
  )
);
create policy revisions_insert_own on public.revisions for insert with check (
  public.is_admin() or exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or lower(o.client_email) = public.current_user_email())
  )
);

-- order_messages: clients can read/write their own threads, admins all
create policy order_messages_select_own on public.order_messages for select using (
  public.is_admin() or exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or lower(o.client_email) = public.current_user_email())
  )
);
create policy order_messages_insert_own on public.order_messages for insert with check (
  public.is_admin() or exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or lower(o.client_email) = public.current_user_email())
  )
);
create policy order_messages_admin_update on public.order_messages for update using (public.is_admin()) with check (public.is_admin());

-- transactions: users read their own, admins read all. Writes via service role only.
create policy transactions_select_own on public.transactions for select using (
  public.is_admin() or lower(client_email) = public.current_user_email()
);

-- invoices: users read their own, admins read all.
create policy invoices_select_own on public.invoices for select using (
  public.is_admin() or lower(client_email) = public.current_user_email()
);

-- receipts: users read their own, admins read all.
create policy receipts_select_own on public.receipts for select using (
  public.is_admin() or lower(client_email) = public.current_user_email()
);

-- ============================================================
-- STORAGE BUCKETS
-- client-uploads:     users upload their artwork; public can view
-- finished-packages:  only admins upload; public can view
-- ============================================================
insert into storage.buckets (id, name, public)
values ('client-uploads', 'client-uploads', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('finished-packages', 'finished-packages', true)
on conflict (id) do nothing;

-- Public read for both buckets
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (true);

-- Authenticated users may upload artwork to client-uploads
drop policy if exists storage_client_uploads_write on storage.objects;
create policy storage_client_uploads_write on storage.objects
  for insert with check (
    bucket_id = 'client-uploads' and auth.role() = 'authenticated'
  );

-- Admins may upload finished machine files
drop policy if exists storage_finished_packages_admin on storage.objects;
create policy storage_finished_packages_admin on storage.objects
  for all using (
    bucket_id = 'finished-packages' and public.is_admin()
  ) with check (
    bucket_id = 'finished-packages' and public.is_admin()
  );

-- ============================================================
-- SEED: Default site settings (non-sensitive, admin managed)
-- ============================================================
insert into public.site_config (key, value) values
  ('site_settings', '{"siteTitle":"B Digitizing & Vector Studio","supportEmail":"orders@bdigitizing.pro","contactPhone":"+1 (800) 555-DIGI","bannerNotice":"⚡ 4-Hour Express Turnaround Available | Guaranteed Commercial Quality","operationalStatus":"Online & Processing","currencySymbol":"$"}')
on conflict (key) do nothing;
