-- ============================================================
-- B Digitizing — PRODUCTION MIGRATION (Run in Supabase SQL Editor)
-- This is a consolidated script combining schema.sql + seed.sql + fixes.
-- SAFE TO RUN MULTIPLE TIMES (uses IF NOT EXISTS and ON CONFLICT).
-- ============================================================

-- 0. Enable required extensions
create extension if not exists pgcrypto;

-- ============================================================
-- 1. ADD MISSING COLUMNS TO EXISTING LIVE TABLES
-- ============================================================

-- Add user_id to existing tables that are missing it
alter table public.clients add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.clients add column if not exists updated_at timestamptz default now();
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.orders add column if not exists type text;
alter table public.orders add column if not exists is_store_item boolean not null default false;
alter table public.orders add column if not exists quantity integer;
alter table public.orders add column if not exists backing text;
alter table public.orders add column if not exists border_type text;
alter table public.order_files add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.transactions add column if not exists user_id uuid references auth.users (id) on delete set null;

-- Fix wallet_balance default from 150 to 0 for new clients
alter table public.clients alter column wallet_balance set default 0;

-- ============================================================
-- 2. DROP OLD DANGEROUS RLS POLICIES
-- ============================================================

drop policy if exists "Allow public read/write on orders" on public.orders;
drop policy if exists "Allow public read/write on order_files" on public.order_files;
drop policy if exists "Allow public read/write on revisions" on public.revisions;
drop policy if exists "Allow public read/write on users" on public.users;
drop policy if exists "Allow public read/write on transactions" on public.transactions;
drop policy if exists "Allow public read/write on clients" on public.clients;
drop policy if exists "Allow public read/write on store_products" on public.store_products;
drop policy if exists "Allow public read/write on conversations" on public.conversations;
drop policy if exists "Allow public read/write on messages" on public.messages;
drop policy if exists "Public Read/Write Client Uploads" on storage.objects;
drop policy if exists "Public Read/Write Finished Packages" on storage.objects;

-- ============================================================
-- 3. ADMIN ROLE HELPER FUNCTIONS
-- ============================================================

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower((auth.jwt() ->> 'email'))
$$;

-- ============================================================
-- 4. CREATE ALL MISSING TABLES
-- ============================================================

-- ADMINS TABLE
create table if not exists public.admins (
  email text primary key,
  name text,
  created_at timestamptz not null default now()
);

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

-- PRICING CARDS
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

-- SITE CONFIG (CMS key/value store)
create table if not exists public.site_config (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- ORDER MESSAGES (chat between client and studio per order)
create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders (id) on delete cascade,
  sender text,
  sender_role text not null default 'client',
  text text,
  attachments jsonb not null default '[]'::jsonb,
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
-- 5. CREATE INDEXES
-- ============================================================

create index if not exists clients_email_idx on public.clients (email);
create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists orders_client_email_idx on public.orders (client_email);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_files_order_id_idx on public.order_files (order_id);
create index if not exists revisions_order_id_idx on public.revisions (order_id);
create index if not exists order_messages_order_id_idx on public.order_messages (order_id);
create index if not exists transactions_client_email_idx on public.transactions (client_email);

-- ============================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table public.admins enable row level security;
alter table public.services enable row level security;
alter table public.pricing_cards enable row level security;
alter table public.patch_cards enable row level security;
alter table public.store_products enable row level security;
alter table public.portfolio enable row level security;
alter table public.sew_outs enable row level security;
alter table public.hero_slides enable row level security;
alter table public.digitizers enable row level security;
alter table public.site_config enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_files enable row level security;
alter table public.revisions enable row level security;
alter table public.order_messages enable row level security;
alter table public.transactions enable row level security;

-- Drop all possible existing policies to avoid conflicts
do $$ begin
  drop policy if exists catalog_read_all on public.services;
  drop policy if exists catalog_admin_write on public.services;
  drop policy if exists catalog_read_all on public.pricing_cards;
  drop policy if exists catalog_admin_write on public.pricing_cards;
  drop policy if exists catalog_read_all on public.patch_cards;
  drop policy if exists catalog_admin_write on public.patch_cards;
  drop policy if exists catalog_read_all on public.store_products;
  drop policy if exists catalog_admin_write on public.store_products;
  drop policy if exists catalog_read_all on public.portfolio;
  drop policy if exists catalog_admin_write on public.portfolio;
  drop policy if exists catalog_read_all on public.sew_outs;
  drop policy if exists catalog_admin_write on public.sew_outs;
  drop policy if exists catalog_read_all on public.hero_slides;
  drop policy if exists catalog_admin_write on public.hero_slides;
  drop policy if exists catalog_read_all on public.digitizers;
  drop policy if exists catalog_admin_write on public.digitizers;
  drop policy if exists site_config_read_all on public.site_config;
  drop policy if exists site_config_admin_write on public.site_config;
  drop policy if exists admins_read_only on public.admins;
  drop policy if exists admins_admin_write on public.admins;
  drop policy if exists clients_select_own on public.clients;
  drop policy if exists clients_update_own on public.clients;
  drop policy if exists clients_insert_service on public.clients;
  drop policy if exists orders_select_own on public.orders;
  drop policy if exists orders_insert_own on public.orders;
  drop policy if exists orders_update_own on public.orders;
  drop policy if exists orders_delete_own on public.orders;
  drop policy if exists order_files_select_own on public.order_files;
  drop policy if exists order_files_insert_own on public.order_files;
  drop policy if exists revisions_select_own on public.revisions;
  drop policy if exists revisions_insert_own on public.revisions;
  drop policy if exists order_messages_select_own on public.order_messages;
  drop policy if exists order_messages_insert_own on public.order_messages;
  drop policy if exists order_messages_admin_update on public.order_messages;
  drop policy if exists transactions_select_own on public.transactions;
  drop policy if exists storage_public_read on storage.objects;
  drop policy if exists storage_client_uploads_write on storage.objects;
  drop policy if exists storage_finished_packages_admin on storage.objects;
end $$;

-- Catalog read for everyone (public pages)
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

-- Site config: public read, admin write
create policy site_config_read_all on public.site_config for select using (true);
create policy site_config_admin_write on public.site_config for all using (public.is_admin()) with check (public.is_admin());

-- Admins table: admin-only access
create policy admins_read_only on public.admins for select using (public.is_admin());
create policy admins_admin_write on public.admins for all using (public.is_admin()) with check (public.is_admin());

-- Clients: own profile + admin access
create policy clients_select_own on public.clients for select using (
  lower(email) = public.current_user_email() or public.is_admin()
);
create policy clients_update_own on public.clients for update using (
  lower(email) = public.current_user_email() or public.is_admin()
) with check (
  lower(email) = public.current_user_email() or public.is_admin()
);
create policy clients_insert_service on public.clients for insert with check (
  auth.role() = 'authenticated' or public.is_admin()
);

-- Orders: own orders + admin access
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

-- Order files
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

-- Revisions
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

-- Order messages
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

-- Transactions
create policy transactions_select_own on public.transactions for select using (
  public.is_admin() or lower(client_email) = public.current_user_email()
);

-- ============================================================
-- 7. STORAGE BUCKETS & POLICIES
-- ============================================================

insert into storage.buckets (id, name, public)
values ('client-uploads', 'client-uploads', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('finished-packages', 'finished-packages', true)
on conflict (id) do nothing;

-- Public read for both buckets
create policy storage_public_read on storage.objects
  for select using (true);

-- Authenticated users may upload artwork
create policy storage_client_uploads_write on storage.objects
  for insert with check (
    bucket_id = 'client-uploads' and auth.role() = 'authenticated'
  );

-- Admins may upload/manage finished machine files
create policy storage_finished_packages_admin on storage.objects
  for all using (
    bucket_id = 'finished-packages' and public.is_admin()
  ) with check (
    bucket_id = 'finished-packages' and public.is_admin()
  );

-- ============================================================
-- 8. AUTH TRIGGER — Create client record on signup
-- ============================================================

-- Drop old trigger that writes to public.users
drop trigger if exists on_auth_user_created on auth.users;

-- Create new function that writes to public.clients
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.clients (user_id, name, full_name, email, company, company_name, wallet_balance, orders_count)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'company', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    0,
    0
  )
  on conflict (email) do update set
    user_id = excluded.user_id,
    full_name = coalesce(excluded.full_name, public.clients.full_name);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 9. SEED MASTER ADMIN
-- ============================================================

insert into public.admins (email, name)
values ('shahidbutt59191@gmail.com', 'Shahid Butt')
on conflict (email) do nothing;

-- ============================================================
-- 10. SEED DEFAULT SITE SETTINGS
-- ============================================================

insert into public.site_config (key, value) values
  ('site_settings', '{"siteTitle":"B Digitizing & Vector Studio","supportEmail":"orders@bdigitizing.pro","contactPhone":"+1 (800) 555-DIGI","bannerNotice":"⚡ 4-Hour Express Turnaround Available | Guaranteed Commercial Quality","operationalStatus":"Online & Processing","currencySymbol":"$"}')
on conflict (key) do nothing;

insert into public.site_config (key, value) values
  ('pricing', '{"minOrderFee":10,"ratePerThousandStitches":1.5,"rushSurcharge":10,"vectorSimpleRate":15,"vectorComplexRate":30,"cap3dPuffSurcharge":5}')
on conflict (key) do nothing;

-- ============================================================
-- 11. SEED CATALOG DATA
-- ============================================================

-- SERVICES
insert into public.services (id, title, price, stitches, time, icon, route, description, sort_order) values
  ('embroidery-digitizing', 'Commercial Embroidery Digitizing', 'Starting $10.00', 'DST, PES, EMB, EXP, VP3, JEF', '4 - 12 Hours', 'Layers', '/services/embroidery-digitizing', 'Production-ready embroidery machine files engineered for Tajima, Brother, Melco, Janome & Barudan machines with zero thread breaks.', 1),
  ('vector-tracing', 'Raster to Scalable Vector Redraw', 'Starting $15.00', 'AI, EPS, SVG, PDF, CDR', '4 - 12 Hours', 'PenTool', '/services/vector-tracing', 'Transform pixelated JPEGs, PNGs, and sketches into 100% hand-drawn scalable vector files with Pantone color separation.', 2),
  ('custom-patches', 'Physical Custom Patches & Emblems', 'Starting $1.50 / patch', 'Iron-On, Velcro & Sew-On', '3 - 5 Days + Express Ship', 'Tag', '/custom-patches', 'High-density embroidered, 3D molded waterproof PVC, woven, and laser-engraved leather patches with physical worldwide shipping.', 3)
on conflict (id) do update set title = excluded.title, price = excluded.price, stitches = excluded.stitches, time = excluded.time, icon = excluded.icon, route = excluded.route, description = excluded.description, sort_order = excluded.sort_order;

-- PRICING CARDS
insert into public.pricing_cards (id, category, title, rate, unit, badge, popular, highlight, features, sort_order) values
  ('pcard-basic', 'embroidery', 'Basic Digitizing', 'Starting from $5.00', 'Ideal for simple left chest / small logos', 'ESSENTIAL', false, false, '["Standard turnaround",".DST / .PES machine files","Essential stitch paths & underlay"]', 1),
  ('pcard-standard', 'embroidery', 'Standard Digitizing', 'Starting from $10.00', 'Ideal for standard left chest & caps', 'MOST POPULAR', true, false, '["4-Hour Express Available","Free native .EMB source files","100% Free Unlimited Revisions"]', 2),
  ('pcard-premium', 'embroidery', 'Premium Digitizing', 'Starting from $20.00', 'Ideal for Jacket Backs & Large Crests', 'VIP & COMPLEX', false, true, '["3D Puff Cap density pathing","Jacket back high stitch count verification","24/7 Priority studio support"]', 3)
on conflict (id) do update set category = excluded.category, title = excluded.title, rate = excluded.rate, unit = excluded.unit, badge = excluded.badge, popular = excluded.popular, highlight = excluded.highlight, features = excluded.features, sort_order = excluded.sort_order;

-- PATCH CARDS
insert into public.patch_cards (id, title, rate, unit, badge, popular, highlight, features, sort_order) values
  ('patch-basic', 'Basic Woven Patches', 'Starting from $1.50 / patch', 'Ideal for simple logos and bulk orders', 'ESSENTIAL', false, false, '["Flat stitched edge detail","Iron-on backing","Ideal for simple logos & high-volume bulk runs","Standard 7-10 day studio turnaround"]', 1),
  ('patch-standard', 'Standard Embroidered Patches', 'Starting from $2.50 / patch', '3D raised thread texture & merrowed border', 'MOST POPULAR', true, false, '["Classic merrowed border edges","3D raised thread texture","Velcro or heat-seal backing options","Free pre-production digital proof"]', 2),
  ('patch-premium', 'Premium 3D PVC & Leather Patches', 'Starting from $3.50 / patch', 'Waterproof 3D molded PVC or genuine leather', 'LUXURY & PVC', false, true, '["High-durability waterproof PVC or genuine leather","Laser-cut precision border outlines","Tactical velcro or adhesive mounting","VIP priority production"]', 3)
on conflict (id) do update set title = excluded.title, rate = excluded.rate, unit = excluded.unit, badge = excluded.badge, popular = excluded.popular, highlight = excluded.highlight, features = excluded.features, sort_order = excluded.sort_order;

-- STORE PRODUCTS
insert into public.store_products (id, category, title, price, unit, min_quantity, badge, status, image, description, sizes, colors, features, sort_order) values
  ('store-tshirt-1', 'tshirts', 'Custom Embroidered Heavyweight T-Shirt', '$12.99', 'per shirt', 10, 'Bestseller', 'active', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80', '100% Ring-spun cotton tees customized with your logo in high-density embroidery.', '["S","M","L","XL","2XL","3XL"]', '["Navy Blue","Classic Black","Pure White","Heather Gray"]', '["Heavyweight 220 GSM 100% Cotton","Up to 10,000 stitches left chest embroidery","Free pre-production sew-out proof","Individual poly-bagged & retail folded"]', 1),
  ('store-tshirt-2', 'tshirts', 'Performance Athletic Polo & Sport Tee', '$16.50', 'per shirt', 5, 'Moisture Wicking', 'active', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80', 'Breathable dry-fit polyester performance polos ideal for staff uniforms & corporate teams.', '["S","M","L","XL","2XL"]', '["Royal Blue","Charcoal","Forest Green"]', '["100% Micro-polyester UV protection","Precision collar & sleeve embroidery","Wrinkle & stain resistant fabric","5-7 day express shipping"]', 2),
  ('store-patch-1', 'patches', 'Custom Merrowed Embroidered Patches', '$2.50', '/ patch', 10, 'Popular Emblem', 'active', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 'Classic merrowed border custom embroidered patches with heat-seal or velcro backing.', '["2\" Round","3\" Circle","4\" Shield","Custom Shape"]', '["Velcro Backing","Iron-On","Sew-On"]', '["3D raised thread texture detail","100% High-durability rayon thread","Merrowed border overlock edge","Free digital proof before production"]', 3),
  ('store-patch-2', 'patches', 'Tactical 3D Molded PVC & Rubber Patches', '$3.50', '/ patch', 10, 'Tactical & Durable', 'active', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', 'Weatherproof 3D molded PVC rubber patches designed for military, police & outdoor gear.', '["3\" Tactical Oval","4\" Rectangular","Custom Die-Cut"]', '["Coyote Tan","Tactical Black","OD Green"]', '["100% Waterproof & UV fade proof","Tactical hook & loop velcro backing","Deep 3D dimension molded layers","VIP priority production"]', 4),
  ('store-cap-1', 'caps', 'Custom 3D Puff Embroidered Snapback Cap', '$9.99', '/ hat', 12, 'High Density 3D', 'active', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80', '6-Panel structured snapback caps customized with 3D foam raised embroidery.', '["One Size Fits All (Adjustable)"]', '["Black / Red Peak","Navy / White","All Black"]', '["3D Raised foam puff embroidery","Structured 6-panel premium twill","Curved or flat visor options","Side & back custom text included"]', 5),
  ('store-vector-1', 'vector', 'Vector Art + Digitizing Master Bundle', '$15.00', 'Flat rate', 1, 'Digital Master', 'active', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80', 'Complete logo restoration bundle including vector files (AI, EPS, SVG) + machine stitch files (.EMB, .DST).', '["All Standard Machine Formats"]', '["Full Color Separation"]', '["Clean node vector reconstruction","All embroidery machine formats (.DST, .PES, .EMB)","Free color separation for screen printing","2-4 Hour express rush turnaround"]', 6)
on conflict (id) do update set category = excluded.category, title = excluded.title, price = excluded.price, unit = excluded.unit, min_quantity = excluded.min_quantity, badge = excluded.badge, status = excluded.status, image = excluded.image, description = excluded.description, sizes = excluded.sizes, colors = excluded.colors, features = excluded.features, sort_order = excluded.sort_order;

-- PORTFOLIO
insert into public.portfolio (id, title, category, stitch_count, colors, original_image, digitized_image, description, sort_order) values
  ('port-1', 'Majestic Eagle Emblem', 'Embroidery Digitizing', '12,450 Stitches', '5 Thread Colors', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', 'Crisp satin stitch outline with dense fill underlay optimized for smooth pique knit fabric.', 1),
  ('port-2', 'Cybernetics 3D Raised Cap Logo', 'Embroidery Digitizing', '15,800 Stitches', '2 Thread Colors (3mm Foam)', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80', 'Precision capped ends for foam perforations with zero thread breaks on cap frames.', 2),
  ('port-3', 'Vintage Skull & Rose Vector', 'Vector Art Conversion', 'N/A (Clean Vector)', '4 Screen Separation Colors', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80', 'Raster JPG transformed into resolution-independent AI/SVG vector with pantone color matching.', 3),
  ('port-4', 'Tactical Merrowed Border Patch', 'Custom Patches', '18,200 Stitches', '6 Rayon Thread Colors', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', 'High-density rayon thread embroidery with classic overlock merrowed border edges and heavy-duty velcro backing.', 4),
  ('port-8', 'Tactical 3D Molded Rubber PVC Patch', 'Custom Patches', '3D Molded PVC', '3 Color Molded Rubber', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', '100% waterproof molded PVC patch with deep dimensional layers, laser-cut border edges, and tactical hook-and-loop velcro.', 5)
on conflict (id) do update set title = excluded.title, category = excluded.category, stitch_count = excluded.stitch_count, colors = excluded.colors, original_image = excluded.original_image, digitized_image = excluded.digitized_image, description = excluded.description, sort_order = excluded.sort_order;

-- SEW OUTS
insert into public.sew_outs (id, title, category, before_img, after_img, stitch_count, formats, features, sort_order) values
  ('sewout-1', 'Logo Digitizing (Cap Embroidery)', 'Cap & Snapback Logo', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', '8,400 Stitches', 'DST, PES, EMB, EXP', '["Center-out cap pathing","3D foam raised thread depth","Zero needle breaks"]', 1),
  ('sewout-2', 'Live Graphic Image Digitizing', 'Complex Artwork & Emblems', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', '14,200 Stitches', 'DST, PES, JEF, HUS', '["High-density tatami fill","Precision color blending","Clean outline satin borders"]', 2),
  ('sewout-3', 'Left Chest Digitizing (Polo & Apparel)', 'Corporate Uniform Logo', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80', '6,800 Stitches', 'DST, PES, EMB, VP3', '["Knit fabric pull compensation","Smooth Underlay foundation","Zero puckering guaranteed"]', 3)
on conflict (id) do update set title = excluded.title, category = excluded.category, before_img = excluded.before_img, after_img = excluded.after_img, stitch_count = excluded.stitch_count, formats = excluded.formats, features = excluded.features, sort_order = excluded.sort_order;

-- HERO SLIDES
insert into public.hero_slides (id, service_key, badge, title, highlight, description, rate_label, primary_cta, secondary_cta, banner_image, trust_points, sort_order) values
  ('slide-1', 'embroidery', 'COMMERCIAL DIGITIZING • STARTS $10.00', 'Commercial Embroidery Digitizing', '100% Machine Ready', 'Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks.', 'Starting from $10.00 / logo', 'Upload Embroidery Design', 'View Digitizing Rates', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80', '[{"title":"100% Manual Digitizing","sub":"Wilcom master pathing, zero auto-trace"},{"title":"Free Revisions Included","sub":"100% satisfaction guaranteed"},{"title":"Machine-Ready Formats","sub":"DST, PES, EXP, EMB, JEF, VP3"},{"title":"Super Fast 4-12 Hrs Delivery","sub":"24/7 express rush processing"}]', 1),
  ('slide-2', 'vector', 'VECTOR ART TRACING • STARTS $15.00', 'Raster to Scalable Vector Redraw', '100% Hand-Drawn Node Tracing', 'Transform low-resolution JPEGs, PNGs, and sketches into 100% resolution-independent vector graphics (.AI, .EPS, .SVG, .PDF, .CDR) with Pantone spot color separation for screen printing & vinyl cutting.', 'Starting from $15.00 flat', 'Upload Artwork for Vectoring', 'View Vector Rates', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80', '[{"title":"Hand-Drawn Node Paths","sub":"Clean curves & sharp vectors"},{"title":"Pantone Color Separation","sub":"Screen printing & vinyl cut ready"},{"title":"Master Source Files Included","sub":"AI, EPS, SVG, PDF, CDR"},{"title":"4-8 Hour Delivery","sub":"Same-day express delivery"}]', 2),
  ('slide-3', 'patches', 'CUSTOM PATCHES • STARTS $1.50 / PATCH', 'Physical Custom Patches & Emblems', 'Worldwide Physical Shipping', 'Order high-density embroidered patches, 3D molded waterproof PVC emblems, woven labels, and genuine laser-engraved leather patches with physical shipping worldwide.', 'Starting from $1.50 / patch', 'Order Custom Patches', 'Explore Patch Tiers', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', '[{"title":"Velcro & Iron-On Backing","sub":"Hook & loop, heat seal or sew-on"},{"title":"Classic Merrowed Borders","sub":"Overlock edges & die-cut shapes"},{"title":"Waterproof 3D Molded PVC","sub":"High-durability tactical rubber"},{"title":"3-5 Days Production","sub":"Express physical delivery"}]', 3)
on conflict (id) do update set service_key = excluded.service_key, badge = excluded.badge, title = excluded.title, highlight = excluded.highlight, description = excluded.description, rate_label = excluded.rate_label, primary_cta = excluded.primary_cta, secondary_cta = excluded.secondary_cta, banner_image = excluded.banner_image, trust_points = excluded.trust_points, sort_order = excluded.sort_order;

-- DIGITIZERS
insert into public.digitizers (id, name, role, rating, active_jobs, avatar) values
  ('dig-1', 'Alex Mercer', 'Master Embroidery Digitizer', 4.9, 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'),
  ('dig-2', 'Elena Rostova', 'Lead Vector Artist & Separation', 5.0, 2, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'),
  ('dig-3', 'Marcus Vance', '3D Puff & Cap Specialist', 4.8, 4, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80')
on conflict (id) do update set name = excluded.name, role = excluded.role, rating = excluded.rating, active_jobs = excluded.active_jobs, avatar = excluded.avatar;

-- SERVICE CMS CONTENT
insert into public.site_config (key, value) values
  ('service_cms', '{"embroidery":{"hero":{"title":"Commercial Embroidery Digitizing","highlight":"100% Guaranteed","subtext":"Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks.","badge":"STARTS $10.00","primaryCta":"Upload Embroidery Design","secondaryCta":"View Digitizing Rates","trustPoints":[{"title":"100% Manual Digitizing","sub":"Master digitizers, zero auto-trace"},{"title":"Free Revisions Included","sub":"100% satisfaction guaranteed"},{"title":"Machine-Ready Formats","sub":"DST, PES, EXP, EMB, JEF"},{"title":"Super Fast 4-12 Hrs Delivery","sub":"24/7 express rush processing"}]},"showcase":{"title":"Embroidery Sew-Outs & Stitch Quality Showcase","subtext":"Real commercial embroidery sew-outs produced on Tajima, Brother, and Barudan multi-head industrial machines."},"workflow":{"title":"How It Works: Embroidery Digitizing Workflow","subtext":"From initial logo upload to machine-ready stitch file delivery in 4 simple steps.","steps":[{"step":"01","title":"Upload Raster / Vector Logo","desc":"Submit your logo file and specify target fabric type (polo, cap, hoodie) and required dimensions."},{"step":"02","title":"Manual Pathing & Density Mapping","desc":"Master digitizers set Wilcom underlay density, satin stitch directions, and fabric pull compensation."},{"step":"03","title":"Virtual Stitch Simulation & Testing","desc":"Every machine file undergoes pathing simulation to guarantee zero thread trims and zero needle breaks."},{"step":"04","title":"Instant Download & Free Revisions","desc":"Download production-ready machine files (.DST, .PES, .EMB) with 100% free unlimited revisions."}]}},"vector":{"hero":{"title":"Raster to Scalable Vector Redraw","highlight":"Hand-Traced Vector","subtext":"Transform pixelated JPEGs, PNGs, and hand sketches into 100% resolution-independent vector graphics (.AI, .EPS, .SVG, .PDF) with Pantone spot color separation.","badge":"STARTS $15.00 FLAT","primaryCta":"Upload Artwork for Vectoring","secondaryCta":"View Vector Rates","trustPoints":[{"title":"100% Hand-Drawn Node Paths","sub":"Clean vectors for printing & cutting"},{"title":"Pantone Spot Color Separation","sub":"Screen printing & vinyl cut ready"},{"title":"Master Source Files Included","sub":"AI, EPS, SVG, PDF, CDR"},{"title":"6-12 Hrs Turnaround","sub":"Same-day vector delivery"}]},"showcase":{"title":"Vector Art Redrawing & Separation Showcase","subtext":"Low-res raster JPEGs converted into resolution-independent Adobe Illustrator vector node paths."},"workflow":{"title":"How It Works: Vector Art Conversion Workflow","subtext":"Pixel-perfect node tracing and color separation for print and vinyl cutting.","steps":[{"step":"01","title":"Upload Low-Res Image or Sketch","desc":"Upload your pixelated JPEG, PNG, or hand sketch with target printing specifications."},{"step":"02","title":"Manual Pen-Tool Vector Tracing","desc":"Vector artists redraw your logo node-by-node in Adobe Illustrator — zero auto-tracing distortion."},{"step":"03","title":"Color Separation & Scale Adjustment","desc":"Clean Pantone spot color layer separation ready for screen printing films and vinyl plotters."},{"step":"04","title":"Instant Vector Delivery","desc":"Download resolution-independent master vector source files (.AI, .EPS, .SVG, .PDF)."}]}},"patch":{"hero":{"title":"Physical Custom Patches & Emblems","highlight":"Physical Shipping","subtext":"Order high-density embroidered patches, 3D molded waterproof PVC emblems, woven labels, and genuine laser-engraved leather patches with physical shipping worldwide.","badge":"STARTS $1.50 / PATCH","primaryCta":"Order Custom Patches","secondaryCta":"Explore Patch Tiers","trustPoints":[{"title":"Velcro & Iron-On Backing","sub":"Hook & loop, heat seal or sew-on"},{"title":"Classic Merrowed Borders","sub":"Overlock edges & die-cut shapes"},{"title":"Waterproof 3D Molded PVC","sub":"High-durability tactical rubber"},{"title":"3-5 Days Production","sub":"Express physical delivery"}]},"showcase":{"title":"Physical Custom Patches & Goods Showcase","subtext":"Custom embroidered, woven, PVC rubber, and genuine leather emblems delivered nationwide."},"workflow":{"title":"How It Works: Custom Patches Production Workflow","subtext":"Crafting premium physical emblems from digital proofing to doorstep delivery.","steps":[{"step":"01","title":"Artwork Submission & Specs","desc":"Upload your artwork and choose patch material (Embroidered, Woven, PVC, Leather), backing, and border."},{"step":"02","title":"Digital Proof & Approval","desc":"Receive a high-resolution 1:1 digital mockup & physical sample proof for final approval before mass production."},{"step":"03","title":"Precision Stitching & Molding","desc":"High-density embroidery, fine woven thread weaving, or 3D waterproof PVC vulcanization."},{"step":"04","title":"Quality Check & Express Shipping","desc":"Every emblem undergoes strict quality inspection before express physical shipping worldwide."}]}}}')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================
-- MIGRATION COMPLETE ✅
-- ============================================================
