-- ============================================================
-- 000 — BASELINE: Enermo production schema as of 2026-11-26
-- ============================================================
-- PURPOSE
--   The repo's schema.sql had drifted behind production (it was missing
--   enquiries, payments, payment_events, notifications_log and
--   vendor_capabilities). This file records what production looks like so a
--   fresh environment (staging, local, a new dev) can be built to match.
--
-- DO NOT RUN AGAINST PRODUCTION — it already has all of this.
--   It is written to be idempotent (IF NOT EXISTS / OR REPLACE), so an
--   accidental run should be harmless, but that is a safety net, not intent.
--
-- ORDER
--   000_baseline → 001/002 are already folded in here → 003_google_oauth...
--
-- SOURCES
--   • Tables, columns, defaults, CHECKs, FKs: Supabase table export (2026-11-26)
--   • Precise numeric types, FK ON DELETE rules, RLS policies and
--     handle_new_user() for the original MVP tables: repo schema.sql
--     (the Supabase export flattens numeric(12,2) → numeric and omits
--     ON DELETE rules, policies, functions and triggers)
--
-- KNOWN GAPS — see "TODO: reconcile" at the bottom
--   RLS policies, indexes, the pg_net enquiry trigger and is_vendor_owner()
--   for the post-MVP tables were not in the export.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto; -- gen_random_uuid() (built-in on PG13+, harmless)

-- ------------------------------------------------------------
-- Types
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'vendor_capability') then
    create type public.vendor_capability as enum (
      'supplier', 'installer', 'maintenance', 'financial_institution', 'rental_provider'
    );
  end if;
end $$;

-- ============================================================
-- MVP TABLES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'vendor', 'admin')),
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  icon text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  business_name text not null,
  description text,
  logo_url text,
  cover_url text,
  website text,
  email text,
  phone text,
  location text,
  city text,
  country text default 'Botswana',
  verified boolean default false,
  active boolean default true,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references public.vendors(id) on delete cascade,
  category_id uuid references public.categories(id),
  title text not null,
  slug text not null unique,
  description text,
  price numeric(12,2),
  currency text default 'BWP',
  unit text default 'unit',
  capacity text,
  brand text,
  model text,
  sku text,
  stock_qty integer default 0,
  in_stock boolean default true,
  warranty_months integer,
  features text[],
  tags text[],
  status text default 'published' check (status in ('draft', 'published', 'archived')),
  view_count integer default 0,
  inquiry_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  alt text,
  is_primary boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Legacy product-level inquiries (see also public.enquiries below)
create table if not exists public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  message text not null,
  status text default 'open' check (status in ('open', 'replied', 'closed')),
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique
    default concat('ORD-', to_char(now(), 'YYYYMMDD'), '-', substr(uuid_generate_v4()::text, 1, 6)),
  customer_id uuid references public.profiles(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  currency text default 'BWP',
  status text default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes text,
  shipping_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- POST-MVP TABLES (formerly migrations 001 / vendor capabilities)
-- FK ON DELETE rules were not in the export, so these use the Postgres
-- default (NO ACTION) — matching what the export literally shows.
-- ============================================================

create table if not exists public.vendor_capabilities (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendors(id),
  capability public.vendor_capability not null,
  created_at timestamptz default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id),
  vendor_id uuid references public.vendors(id),
  system_type text not null
    check (system_type in ('solar', 'battery', 'inverter', 'ev_charging', 'biogas', 'monitoring', 'other')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  -- CHECK (not an enum) so Orange Money / MyZaka can be added without ALTER TYPE
  provider text not null check (provider = 'stripe'),
  provider_reference text,
  amount numeric not null check (amount > 0),
  currency text not null default 'BWP',
  status text not null default 'requires_payment'
    check (status in ('requires_payment', 'processing', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append-only webhook audit log. UNIQUE provider_event_id = idempotency guarantee.
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id),
  provider text not null,
  event_type text not null,
  provider_event_id text not null unique,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  notification_type text not null check (notification_type in (
    'enquiry_confirmation', 'order_confirmation', 'payment_receipt',
    'payment_failed', 'vendor_new_enquiry', 'vendor_new_order'
  )),
  enquiry_id uuid references public.enquiries(id),
  order_id uuid references public.orders(id),
  payment_id uuid references public.payments(id),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Pre-003 version. Migration 003 replaces this with a hardened one.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- RLS is enabled on every table. A table with RLS on and no policy denies
-- all client access — the safe default until the TODO below is filled in.
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.vendors             enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.inquiries           enable row level security;
alter table public.orders              enable row level security;
alter table public.vendor_capabilities enable row level security;
alter table public.enquiries           enable row level security;
alter table public.payments            enable row level security;
alter table public.payment_events      enable row level security;
alter table public.notifications_log   enable row level security;

-- Postgres has no CREATE POLICY IF NOT EXISTS, so drop-then-create keeps this re-runnable.

-- Profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Categories
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories for select using (true);

-- Vendors
drop policy if exists "vendors_select_all" on public.vendors;
create policy "vendors_select_all" on public.vendors for select using (true);
drop policy if exists "vendors_insert_own" on public.vendors;
create policy "vendors_insert_own" on public.vendors for insert with check (auth.uid() = profile_id);
drop policy if exists "vendors_update_own" on public.vendors;
create policy "vendors_update_own" on public.vendors for update using (auth.uid() = profile_id);

-- Products
drop policy if exists "products_select_published" on public.products;
create policy "products_select_published" on public.products for select using (
  status = 'published' or vendor_id in (select id from public.vendors where profile_id = auth.uid())
);
drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products for insert with check (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);
drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products for update using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);
drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products for delete using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

-- Product images
drop policy if exists "product_images_select_all" on public.product_images;
create policy "product_images_select_all" on public.product_images for select using (true);
drop policy if exists "product_images_insert_own" on public.product_images;
create policy "product_images_insert_own" on public.product_images for insert with check (
  product_id in (
    select p.id from public.products p join public.vendors v on p.vendor_id = v.id
    where v.profile_id = auth.uid()
  )
);
drop policy if exists "product_images_delete_own" on public.product_images;
create policy "product_images_delete_own" on public.product_images for delete using (
  product_id in (
    select p.id from public.products p join public.vendors v on p.vendor_id = v.id
    where v.profile_id = auth.uid()
  )
);

-- Inquiries
drop policy if exists "inquiries_insert" on public.inquiries;
create policy "inquiries_insert" on public.inquiries for insert with check (true);
drop policy if exists "inquiries_vendor_select" on public.inquiries;
create policy "inquiries_vendor_select" on public.inquiries for select using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
  or customer_id = auth.uid()
);
drop policy if exists "inquiries_vendor_update" on public.inquiries;
create policy "inquiries_vendor_update" on public.inquiries for update using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

-- Orders
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select using (
  customer_id = auth.uid()
  or vendor_id in (select id from public.vendors where profile_id = auth.uid())
);
drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders for insert with check (auth.uid() = customer_id);
drop policy if exists "orders_vendor_update" on public.orders;
create policy "orders_vendor_update" on public.orders for update using (
  vendor_id in (select id from public.vendors where profile_id = auth.uid())
);

-- ============================================================
-- TODO: reconcile with production
-- ============================================================
-- Not in the table export, so not reproduced above:
--   • RLS policies for vendor_capabilities, enquiries, payments,
--     payment_events, notifications_log
--   • is_vendor_owner() helper function
--   • enquiry notification trigger (pg_net → Express), formerly migration 002
--   • indexes beyond primary keys / unique constraints
--   • real ON DELETE rules for the post-MVP foreign keys
--
-- Run these in the production SQL Editor and paste the output back to fill
-- the gaps:
--
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'public' order by tablename, policyname;
--
--   select p.proname, pg_get_functiondef(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.prokind = 'f';
--
--   select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
--   from information_schema.triggers where trigger_schema in ('public', 'auth');
--
--   select tablename, indexname, indexdef from pg_indexes
--   where schemaname = 'public' order by tablename;
--
--   select conrelid::regclass as tbl, conname, pg_get_constraintdef(oid)
--   from pg_constraint where contype = 'f' and connamespace = 'public'::regnamespace;
