-- ============================================================
-- 005 — Vendor verification documents (CIPA + BURS)
-- Run in the Supabase SQL Editor AFTER 003 and 004. Idempotent.
-- ============================================================
-- Flow
--   1. Vendor uploads a CIPA certificate and a BURS tax clearance certificate
--   2. Each upload is a new row with status 'pending' (old rows kept as history)
--   3. Admin approves or rejects (with a reason)
--   4. vendors.verified becomes true automatically when the LATEST document
--      of every required type is approved — and false again if one is
--      rejected or replaced by a new pending upload.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: is the current user an admin?
-- SECURITY DEFINER so policies can call it without recursive RLS on profiles.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ------------------------------------------------------------
-- 1. vendor_documents
-- ------------------------------------------------------------
create table if not exists public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  -- CHECK (not enum) so new document types can be added without ALTER TYPE
  doc_type text not null check (doc_type in ('cipa_certificate', 'burs_tax_clearance')),
  file_path text not null,              -- path inside the vendor-documents bucket
  file_name text not null check (char_length(file_name) <= 255),
  expires_on date,                      -- e.g. tax clearance expiry, entered by vendor
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text check (char_length(rejection_reason) <= 1000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  uploaded_at timestamptz not null default now()
);

create index if not exists vendor_documents_vendor_idx
  on public.vendor_documents (vendor_id, doc_type, uploaded_at desc);
create index if not exists vendor_documents_pending_idx
  on public.vendor_documents (uploaded_at) where status = 'pending';

alter table public.vendor_documents enable row level security;

-- Vendors: see their own documents
drop policy if exists "vendor_documents_select_own" on public.vendor_documents;
create policy "vendor_documents_select_own" on public.vendor_documents
  for select to authenticated
  using (vendor_id in (select id from public.vendors where profile_id = auth.uid()));

-- Vendors: upload for their own business, always as pending + unreviewed,
-- and only to a file inside their own storage folder
drop policy if exists "vendor_documents_insert_own" on public.vendor_documents;
create policy "vendor_documents_insert_own" on public.vendor_documents
  for insert to authenticated
  with check (
    vendor_id in (select id from public.vendors where profile_id = auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
    and split_part(file_path, '/', 1) = auth.uid()::text
  );
-- No vendor UPDATE/DELETE policy: a vendor can't approve or erase their own records.

-- Admins: read and review everything
drop policy if exists "vendor_documents_admin_select" on public.vendor_documents;
create policy "vendor_documents_admin_select" on public.vendor_documents
  for select to authenticated using (public.is_admin());

drop policy if exists "vendor_documents_admin_update" on public.vendor_documents;
create policy "vendor_documents_admin_update" on public.vendor_documents
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 2. Keep vendors.verified in sync with the documents
-- ------------------------------------------------------------
create or replace function public.sync_vendor_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := coalesce(new.vendor_id, old.vendor_id);
  required text[] := array['cipa_certificate', 'burs_tax_clearance'];
  all_ok boolean;
begin
  select count(*) = array_length(required, 1) into all_ok
  from (
    select distinct on (doc_type) doc_type, status
    from public.vendor_documents
    where vendor_id = v_id and doc_type = any (required)
    order by doc_type, uploaded_at desc
  ) latest
  where latest.status = 'approved';

  update public.vendors set verified = all_ok
  where id = v_id and verified is distinct from all_ok;
  return null;
end;
$$;

drop trigger if exists vendor_documents_sync_verified on public.vendor_documents;
create trigger vendor_documents_sync_verified
  after insert or update or delete on public.vendor_documents
  for each row execute function public.sync_vendor_verified();

-- ------------------------------------------------------------
-- 3. Stop vendors setting verified / rating themselves
-- ------------------------------------------------------------
-- SECURITY: policies "vendors_insert_own" / "vendors_update_own" let a vendor
-- write any column of their own row — including verified = true and rating.
-- Clients may still edit business details; these columns are server-only.
create or replace function public.protect_vendor_trust_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new; -- SQL Editor, service role, SECURITY DEFINER functions
  end if;

  if public.is_admin() then
    return new; -- admins may adjust these by hand
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
    new.rating := 0;
    new.review_count := 0;
  else
    new.verified := old.verified;
    new.rating := old.rating;
    new.review_count := old.review_count;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_protect_trust_fields on public.vendors;
create trigger vendors_protect_trust_fields
  before insert or update on public.vendors
  for each row execute function public.protect_vendor_trust_fields();

-- ------------------------------------------------------------
-- 4. Private storage bucket for the files
-- ------------------------------------------------------------
-- NOT public: files are opened with short-lived signed URLs.
-- Path: {user_id}/{doc_type}-{timestamp}.{ext}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vendor-documents', 'vendor-documents', false, 5242880,       -- 5 MB
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vendor_documents_storage_insert_own" on storage.objects;
create policy "vendor_documents_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vendor-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vendor_documents_storage_select" on storage.objects;
create policy "vendor_documents_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vendor-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
-- No delete policy: uploaded documents are kept for audit.

-- ------------------------------------------------------------
-- 5. Bring existing data in line
-- ------------------------------------------------------------
-- Any vendor marked verified before this migration has no documents on file.
-- Uncomment to require everyone to go through document verification:
-- update public.vendors set verified = false where verified = true;
