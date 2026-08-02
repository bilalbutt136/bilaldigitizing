-- ============================================================
-- B Digitizing & Vector Studio — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists pgcrypto;

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id text primary key,
  title text,
  description text,
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
  requested_formats text[] default array['dst','pes','emb','pdf'],
  is_rush boolean default false,
  price numeric default 15.00,
  cost numeric default 15.00,
  payment_status text default 'Paid',
  notes text,
  artwork_url text,
  image_url text,
  logo text,
  status text default 'submitted',
  output_file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_client_email_idx on public.orders (client_email);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ---------- ORDER FILES ----------
create table if not exists public.order_files (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders (id) on delete cascade,
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

-- ---------- REVISIONS ----------
create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders (id) on delete cascade,
  requested_by text,
  note text,
  notes text,
  status text default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists revisions_order_id_idx on public.revisions (order_id);

-- ---------- CLIENTS ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text,
  full_name text,
  email text not null unique,
  company text,
  company_name text,
  role text default 'customer',
  wallet_balance numeric default 150.00,
  orders_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_email_idx on public.clients (email);

-- ---------- TRANSACTIONS ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  client_email text,
  type text,
  amount numeric,
  payment_method text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_client_email_idx on public.transactions (client_email);

-- ---------- SITE CONFIG (CMS key/value store) ----------
create table if not exists public.site_config (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------
-- NOTE: The app currently uses the anon/publishable key directly for all CRUD.
-- Enable RLS and grant anon access so the site works out of the box.
-- Tighten these policies later by scoping reads/writes to authenticated users.

alter table public.orders enable row level security;
alter table public.order_files enable row level security;
alter table public.revisions enable row level security;
alter table public.clients enable row level security;
alter table public.transactions enable row level security;
alter table public.site_config enable row level security;

drop policy if exists orders_anon_all on public.orders;
create policy orders_anon_all on public.orders for all using (true) with check (true);

drop policy if exists order_files_anon_all on public.order_files;
create policy order_files_anon_all on public.order_files for all using (true) with check (true);

drop policy if exists revisions_anon_all on public.revisions;
create policy revisions_anon_all on public.revisions for all using (true) with check (true);

drop policy if exists clients_anon_all on public.clients;
create policy clients_anon_all on public.clients for all using (true) with check (true);

drop policy if exists transactions_anon_all on public.transactions;
create policy transactions_anon_all on public.transactions for all using (true) with check (true);

drop policy if exists site_config_anon_all on public.site_config;
create policy site_config_anon_all on public.site_config for all using (true) with check (true);

-- ---------- STORAGE BUCKETS ----------
insert into storage.buckets (id, name, public)
values ('client-uploads', 'client-uploads', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('finished-packages', 'finished-packages', true)
on conflict (id) do nothing;

drop policy if exists client_uploads_public on storage.objects;
create policy client_uploads_public on storage.objects
  for all using (bucket_id = 'client-uploads') with check (bucket_id = 'client-uploads');

drop policy if exists finished_packages_public on storage.objects;
create policy finished_packages_public on storage.objects
  for all using (bucket_id = 'finished-packages') with check (bucket_id = 'finished-packages');

-- ---------- SEED: Default site settings ----------
insert into public.site_config (key, value) values
  ('site_settings', '{"siteTitle":"B Digitizing & Vector Studio","supportEmail":"orders@bdigitizing.pro","contactPhone":"+1 (800) 555-DIGI","bannerNotice":"⚡ 4-Hour Express Turnaround Available | Guaranteed Commercial Quality","operationalStatus":"Online & Processing","currencySymbol":"$","adminEmail":"shahidbutt59191@gmail.com"}')
on conflict (key) do nothing;
