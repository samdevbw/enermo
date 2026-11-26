-- ============================================================
-- 003 — Google OAuth support + profile role hardening
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. handle_new_user: support Google metadata, never trust client role
-- ------------------------------------------------------------
-- Google puts the display name in `full_name`/`name` and the photo in
-- `avatar_url`/`picture`. Email sign-ups send `full_name` + `role`.
--
-- SECURITY: raw_user_meta_data is fully client-controlled (anyone can call
-- auth.signUp with data: { role: 'admin' }). Previously that value was
-- inserted as-is. Now only 'vendor' is honoured; everything else → 'customer'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    case when new.raw_user_meta_data->>'role' = 'vendor' then 'vendor' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. Block role changes from the client
-- ------------------------------------------------------------
-- SECURITY: policy "profiles_update_own" lets a user update ANY column of
-- their own row, including role → 'admin'. RLS is row-level, not
-- column-level, so we enforce this with a trigger.
-- Role changes are still allowed from the service role, the SQL Editor,
-- and SECURITY DEFINER functions (which run as their owner, not 'authenticated').
create or replace function public.prevent_client_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon') then
    raise exception 'profiles.role cannot be changed directly'
      using errcode = '42501'; -- insufficient_privilege
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_client_role_change();

-- ------------------------------------------------------------
-- 3. claim_vendor_role(): the one allowed self-service role change
-- ------------------------------------------------------------
-- Google OAuth cannot attach user metadata at sign-up, so a user who picks
-- "Sell Products" and then "Sign up with Google" is created as a customer.
-- The app calls this RPC right after the redirect to upgrade them.
-- It only ever moves customer → vendor (same as email sign-up allows today);
-- admins and existing vendors are untouched.
create or replace function public.claim_vendor_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  result text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.profiles
     set role = 'vendor'
   where id = auth.uid()
     and role = 'customer'
  returning role into result;

  return coalesce(result, (select role from public.profiles where id = auth.uid()));
end;
$$;

revoke all on function public.claim_vendor_role() from public, anon;
grant execute on function public.claim_vendor_role() to authenticated;

-- ------------------------------------------------------------
-- Verify (optional)
-- ------------------------------------------------------------
-- select tgname from pg_trigger where tgrelid = 'public.profiles'::regclass;
-- select proname, prosecdef from pg_proc where proname in
--   ('handle_new_user', 'prevent_client_role_change', 'claim_vendor_role');
