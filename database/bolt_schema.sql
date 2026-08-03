-- Run this snippet to add the BoltPayouts models to your existing database
-- This adds the invoices and receipts tables, and enables RLS.

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

alter table public.invoices enable row level security;
alter table public.receipts enable row level security;

create policy invoices_select_own on public.invoices for select using (
  public.is_admin() or lower(client_email) = public.current_user_email()
);

create policy receipts_select_own on public.receipts for select using (
  public.is_admin() or lower(client_email) = public.current_user_email()
);
