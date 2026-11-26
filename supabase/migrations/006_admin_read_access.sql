-- ============================================================
-- 006 — Admin read access for the admin dashboard
-- Run in the Supabase SQL Editor AFTER 005 (uses public.is_admin()).
-- Idempotent: safe to re-run.
-- ============================================================
-- Existing policies only let customers/vendors see their OWN orders and
-- inquiries, and only PUBLISHED products. Admins need to see everything to
-- run the platform. These policies are additive (RLS ORs policies together),
-- so nothing changes for non-admins.

drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "products_admin_select" on public.products;
create policy "products_admin_select" on public.products
  for select to authenticated using (public.is_admin());

drop policy if exists "inquiries_admin_select" on public.inquiries;
create policy "inquiries_admin_select" on public.inquiries
  for select to authenticated using (public.is_admin());

-- Speeds up the dashboard's "new this week" and "recent" lists
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
