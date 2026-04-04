-- ============================================================
-- ENERMO MVP SCHEMA
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'vendor', 'admin')),
  created_at timestamptz default now()
);

-- Automatically create profile on user signup
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  icon text,
  description text,
  created_at timestamptz default now()
);

insert into categories (name, slug, icon, description) values
  ('Solar Home Systems', 'solar-home-systems', 'sun', 'Complete solar systems for off-grid homes'),
  ('Rooftop Solar', 'rooftop-solar', 'home', 'Grid-tied rooftop solar installations'),
  ('Inverters', 'inverters', 'zap', 'Power inverters and hybrid inverters'),
  ('Batteries', 'batteries', 'battery-charging', 'Solar batteries and storage systems'),
  ('Solar Water Pumps', 'solar-water-pumps', 'droplets', 'Solar-powered water pumping solutions'),
  ('Portable Solar Kits', 'portable-solar-kits', 'briefcase', 'Portable and folding solar panels'),
  ('Commercial Solar', 'commercial-solar', 'building-2', 'Commercial and industrial solar systems'),
  ('Biogas Systems', 'biogas-systems', 'flame', 'Biogas digesters and cooking systems');

-- ============================================================
-- VENDORS
-- ============================================================
create table vendors (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade unique,
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

-- ============================================================
-- PRODUCTS
-- ============================================================
create table products (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade,
  category_id uuid references categories(id),
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

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
create table product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt text,
  is_primary boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- INQUIRIES
-- ============================================================
create table inquiries (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,
  customer_id uuid references profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  message text not null,
  status text default 'open' check (status in ('open', 'replied', 'closed')),
  created_at timestamptz default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null default concat('ORD-', to_char(now(), 'YYYYMMDD'), '-', substr(uuid_generate_v4()::text, 1, 6)),
  customer_id uuid references profiles(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  currency text default 'BWP',
  status text default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes text,
  shipping_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table profiles enable row level security;
alter table vendors enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table inquiries enable row level security;
alter table orders enable row level security;
alter table categories enable row level security;

-- Profiles: users can read all, update their own
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Categories: public read
create policy "categories_select_all" on categories for select using (true);

-- Vendors: public read, vendors manage own
create policy "vendors_select_all" on vendors for select using (true);
create policy "vendors_insert_own" on vendors for insert with check (auth.uid() = profile_id);
create policy "vendors_update_own" on vendors for update using (auth.uid() = profile_id);

-- Products: public read published, vendors manage own
create policy "products_select_published" on products for select using (status = 'published' or vendor_id in (
  select id from vendors where profile_id = auth.uid()
));
create policy "products_insert_own" on products for insert with check (
  vendor_id in (select id from vendors where profile_id = auth.uid())
);
create policy "products_update_own" on products for update using (
  vendor_id in (select id from vendors where profile_id = auth.uid())
);
create policy "products_delete_own" on products for delete using (
  vendor_id in (select id from vendors where profile_id = auth.uid())
);

-- Product images: public read, vendor manage
create policy "product_images_select_all" on product_images for select using (true);
create policy "product_images_insert_own" on product_images for insert with check (
  product_id in (
    select p.id from products p join vendors v on p.vendor_id = v.id where v.profile_id = auth.uid()
  )
);
create policy "product_images_delete_own" on product_images for delete using (
  product_id in (
    select p.id from products p join vendors v on p.vendor_id = v.id where v.profile_id = auth.uid()
  )
);

-- Inquiries: customers create, vendors read own
create policy "inquiries_insert" on inquiries for insert with check (true);
create policy "inquiries_vendor_select" on inquiries for select using (
  vendor_id in (select id from vendors where profile_id = auth.uid())
  or customer_id = auth.uid()
);
create policy "inquiries_vendor_update" on inquiries for update using (
  vendor_id in (select id from vendors where profile_id = auth.uid())
);

-- Orders: customer own, vendor own
create policy "orders_select_own" on orders for select using (
  customer_id = auth.uid()
  or vendor_id in (select id from vendors where profile_id = auth.uid())
);
create policy "orders_insert" on orders for insert with check (auth.uid() = customer_id);
create policy "orders_vendor_update" on orders for update using (
  vendor_id in (select id from vendors where profile_id = auth.uid())
);
