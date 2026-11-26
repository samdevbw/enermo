-- ============================================================
-- 004 — Contact messages + profile/logo image storage
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. contact_messages — submissions from /contact
-- ------------------------------------------------------------
-- Anyone (signed in or not) can INSERT. Nobody can read through the API
-- except admins. View messages in Supabase → Table Editor → contact_messages.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Insert: anyone, but a signed-in user can only attach their own id
drop policy if exists "contact_messages_insert" on public.contact_messages;
create policy "contact_messages_insert" on public.contact_messages
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- Read / update: admins only
drop policy if exists "contact_messages_admin_select" on public.contact_messages;
create policy "contact_messages_admin_select" on public.contact_messages
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update" on public.contact_messages
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- 2. profile-images bucket — avatars and vendor logos
-- ------------------------------------------------------------
-- Public read (images are shown on vendor pages). Each user may only
-- write inside a folder named after their own user id: {uid}/avatar-123.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 2097152,          -- 2 MB
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_images_public_read" on storage.objects;
create policy "profile_images_public_read" on storage.objects
  for select using (bucket_id = 'profile-images');

drop policy if exists "profile_images_insert_own" on storage.objects;
create policy "profile_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_images_update_own" on storage.objects;
create policy "profile_images_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_images_delete_own" on storage.objects;
create policy "profile_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
