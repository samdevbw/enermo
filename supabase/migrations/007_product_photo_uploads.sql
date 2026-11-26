-- ============================================================
-- 007 — Vendor product photo uploads
-- Idempotent: safe to re-run.
-- ============================================================
-- The app's uploadProductImage() wrote to a 'product-images' bucket that was
-- never created, so vendors had no way to add their own product photos.

-- ------------------------------------------------------------
-- 1. Public bucket (product photos are shown to everyone)
-- ------------------------------------------------------------
-- Path: {vendor_user_id}/{product_id}/{timestamp}-{random}.{ext}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,          -- 5 MB
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_storage_public_read" on storage.objects;
create policy "product_images_storage_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Writes only inside the vendor's own folder
drop policy if exists "product_images_storage_insert_own" on storage.objects;
create policy "product_images_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product_images_storage_delete_own" on storage.objects;
create policy "product_images_storage_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- 2. Let vendors change which of their photos is the main one
-- ------------------------------------------------------------
-- product_images had SELECT/INSERT/DELETE policies but no UPDATE, so
-- is_primary / sort_order could never be changed from the app.
drop policy if exists "product_images_update_own" on public.product_images;
create policy "product_images_update_own" on public.product_images
  for update to authenticated
  using (product_id in (
    select p.id from public.products p join public.vendors v on v.id = p.vendor_id
    where v.profile_id = auth.uid()
  ))
  with check (product_id in (
    select p.id from public.products p join public.vendors v on v.id = p.vendor_id
    where v.profile_id = auth.uid()
  ));

create index if not exists product_images_product_idx
  on public.product_images (product_id, sort_order);
