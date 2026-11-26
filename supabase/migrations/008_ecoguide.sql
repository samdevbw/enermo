-- ============================================================
-- 008 — ENERMO EcoGuide (Phase 1)
-- Knowledge base + retrieval, conversations, usage/rate limiting,
-- and the ONLY marketplace queries the AI is allowed to run.
-- Requires 005 (public.is_admin). Idempotent: safe to re-run.
-- ============================================================

create extension if not exists vector with schema extensions;

-- ============================================================
-- 1. KNOWLEDGE BASE
-- ============================================================
-- Articles are edited as whole documents; a trigger splits them into
-- chunks for retrieval, so the knowledge base can grow without code changes.
create table if not exists public.eco_guide_knowledge (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 3 and 200),
  category text not null check (category in (
    'solar', 'solar-components', 'solar-installation', 'batteries', 'biogas',
    'energy-efficiency', 'financing', 'eaas', 'payg', 'rental',
    'enermo-marketplace', 'enermo-vendors', 'enermo-services', 'maintenance'
  )),
  summary text not null check (char_length(summary) <= 400),
  content text not null,
  source text not null default 'ENERMO',           -- where the content came from
  audience text not null default 'all' check (audience in ('all', 'customer', 'vendor')),
  is_published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eco_guide_chunks (
  id uuid primary key default gen_random_uuid(),
  knowledge_id uuid not null references public.eco_guide_knowledge(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding extensions.vector(1536),               -- filled by the ecoguide-embed function
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now(),
  unique (knowledge_id, chunk_index)
);

create index if not exists eco_guide_chunks_fts_idx on public.eco_guide_chunks using gin (fts);
create index if not exists eco_guide_chunks_embedding_idx on public.eco_guide_chunks
  using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists eco_guide_knowledge_category_idx on public.eco_guide_knowledge (category) where is_published;

-- Split an article into ~1,200-character chunks on paragraph boundaries.
-- Each chunk is prefixed with the article title so it stands alone in context.
create or replace function public.eco_guide_rechunk(p_knowledge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  k record;
  para text;
  buf text := '';
  idx int := 0;
begin
  select id, title, content into k from public.eco_guide_knowledge where id = p_knowledge_id;
  delete from public.eco_guide_chunks where knowledge_id = p_knowledge_id;
  if k.id is null then return; end if;

  foreach para in array regexp_split_to_array(k.content, E'\\n\\s*\\n') loop
    para := btrim(para);
    continue when para = '';
    if char_length(buf) > 0 and char_length(buf) + char_length(para) > 1200 then
      insert into public.eco_guide_chunks (knowledge_id, chunk_index, content)
      values (k.id, idx, k.title || E'\n\n' || buf);
      idx := idx + 1;
      buf := '';
    end if;
    buf := case when buf = '' then para else buf || E'\n\n' || para end;
  end loop;

  if buf <> '' then
    insert into public.eco_guide_chunks (knowledge_id, chunk_index, content)
    values (k.id, idx, k.title || E'\n\n' || buf);
  end if;
end;
$$;

create or replace function public.eco_guide_knowledge_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.eco_guide_knowledge_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.content is distinct from old.content or new.title is distinct from old.title then
    perform public.eco_guide_rechunk(new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists eco_guide_knowledge_touch on public.eco_guide_knowledge;
create trigger eco_guide_knowledge_touch
  before update on public.eco_guide_knowledge
  for each row execute function public.eco_guide_knowledge_changed();

drop trigger if exists eco_guide_knowledge_chunk on public.eco_guide_knowledge;
create trigger eco_guide_knowledge_chunk
  after insert or update on public.eco_guide_knowledge
  for each row execute function public.eco_guide_knowledge_after_write();

alter table public.eco_guide_knowledge enable row level security;
alter table public.eco_guide_chunks enable row level security;

drop policy if exists "eco_guide_knowledge_public_read" on public.eco_guide_knowledge;
create policy "eco_guide_knowledge_public_read" on public.eco_guide_knowledge
  for select using (is_published or public.is_admin());

drop policy if exists "eco_guide_knowledge_admin_write" on public.eco_guide_knowledge;
create policy "eco_guide_knowledge_admin_write" on public.eco_guide_knowledge
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "eco_guide_chunks_admin_read" on public.eco_guide_chunks;
create policy "eco_guide_chunks_admin_read" on public.eco_guide_chunks
  for select to authenticated using (public.is_admin());
-- Chunks are written only by the trigger and the embed function (service role).

-- Hybrid retrieval: vector similarity when an embedding is supplied and
-- chunks are embedded; otherwise full-text search with OR semantics
-- (natural questions rarely contain every keyword).
create or replace function public.eco_guide_match_chunks(
  p_query text,
  p_embedding extensions.vector(1536) default null,
  p_match_count int default 5
)
returns table (chunk_id uuid, knowledge_id uuid, slug text, title text, category text, content text, score real)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  q tsquery;
begin
  p_match_count := least(greatest(p_match_count, 1), 10);

  -- Vector search only once EVERY published chunk is embedded; while the
  -- embed backlog is being processed, full-text search covers everything.
  if p_embedding is not null and not exists (
       select 1 from eco_guide_chunks c join eco_guide_knowledge k on k.id = c.knowledge_id
       where k.is_published and c.embedding is null) then
    return query
      select c.id, k.id, k.slug, k.title, k.category, c.content,
             (1 - (c.embedding <=> p_embedding))::real
      from eco_guide_chunks c join eco_guide_knowledge k on k.id = c.knowledge_id
      where k.is_published and c.embedding is not null
      order by c.embedding <=> p_embedding
      limit p_match_count;
    return;
  end if;

  q := nullif(replace(plainto_tsquery('english', coalesce(p_query, ''))::text, '&', '|'), '')::tsquery;
  if q is null then return; end if;

  return query
    select c.id, k.id, k.slug, k.title, k.category, c.content, ts_rank(c.fts, q)::real
    from eco_guide_chunks c join eco_guide_knowledge k on k.id = c.knowledge_id
    where k.is_published and c.fts @@ q
    order by ts_rank(c.fts, q) desc
    limit p_match_count;
end;
$$;

revoke all on function public.eco_guide_match_chunks(text, extensions.vector, int) from public, anon, authenticated;
grant execute on function public.eco_guide_match_chunks(text, extensions.vector, int) to service_role;

-- ============================================================
-- 2. CONVERSATIONS (signed-in users only; private)
-- ============================================================
create table if not exists public.eco_guide_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eco_guide_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.eco_guide_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 20000),
  metadata jsonb not null default '{}'::jsonb,     -- product/vendor cards, sources, estimates
  created_at timestamptz not null default now()
);

create index if not exists eco_guide_conversations_user_idx on public.eco_guide_conversations (user_id, updated_at desc);
create index if not exists eco_guide_messages_conversation_idx on public.eco_guide_messages (conversation_id, created_at);

alter table public.eco_guide_conversations enable row level security;
alter table public.eco_guide_messages enable row level security;

drop policy if exists "eco_guide_conversations_own" on public.eco_guide_conversations;
create policy "eco_guide_conversations_own" on public.eco_guide_conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "eco_guide_messages_own_read" on public.eco_guide_messages;
create policy "eco_guide_messages_own_read" on public.eco_guide_messages
  for select to authenticated
  using (conversation_id in (select id from public.eco_guide_conversations where user_id = auth.uid()));
-- Messages are written by the ecoguide-chat function only (service role), so
-- a user can't forge "assistant" messages into their history.

-- ============================================================
-- 3. USAGE LOG (rate limiting + admin insight)
-- ============================================================
create table if not exists public.eco_guide_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  client_key text not null,                        -- user id, or a salted hash of the IP
  user_role text not null default 'visitor',
  question text check (char_length(question) <= 500),  -- truncated, for "common questions"
  knowledge_hits int not null default 0,           -- 0 = possibly unanswered by the KB
  tools_used text[] not null default '{}',
  model text,
  prompt_tokens int,
  completion_tokens int,
  status text not null default 'ok' check (status in ('ok', 'error', 'rate_limited', 'not_configured')),
  created_at timestamptz not null default now()
);

create index if not exists eco_guide_usage_client_idx on public.eco_guide_usage (client_key, created_at desc);
create index if not exists eco_guide_usage_created_idx on public.eco_guide_usage (created_at desc);

alter table public.eco_guide_usage enable row level security;
drop policy if exists "eco_guide_usage_admin_read" on public.eco_guide_usage;
create policy "eco_guide_usage_admin_read" on public.eco_guide_usage
  for select to authenticated using (public.is_admin());

-- ============================================================
-- 4. APPROVED MARKETPLACE QUERIES (the AI's only database access)
-- ============================================================
-- Return only data already public on enermo.co.bw. No email/phone,
-- no drafts, no inactive vendors.

create or replace function public.eco_guide_search_products(
  p_terms text[] default '{}',
  p_category_slug text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_limit int default 6
)
returns table (
  id uuid, title text, slug text, price numeric, currency text, capacity text,
  brand text, model text, in_stock boolean, warranty_months int, features text[],
  category text, category_slug text, vendor_id uuid, vendor_name text,
  vendor_verified boolean, vendor_city text, image_url text, match_score int
)
language sql
stable
security invoker
set search_path = public
as $$
  with terms as (
    select lower(t) as t from unnest(coalesce(p_terms, '{}')) t where char_length(t) >= 2 limit 8
  ),
  candidates as (
    select p.*, c.name as cat_name, c.slug as cat_slug, v.business_name, v.verified, v.city,
           lower(concat_ws(' ', p.title, p.brand, p.model, p.capacity, p.description, c.name,
                           array_to_string(p.features, ' '), array_to_string(p.tags, ' '))) as haystack
    from products p
    join vendors v on v.id = p.vendor_id and v.active
    left join categories c on c.id = p.category_id
    where p.status = 'published'
      and (p_category_slug is null or c.slug = p_category_slug)
      and (p_min_price is null or p.price >= p_min_price)
      and (p_max_price is null or p.price <= p_max_price)
  )
  select x.id, x.title, x.slug, x.price, x.currency, x.capacity, x.brand, x.model, x.in_stock,
         x.warranty_months, x.features, x.cat_name, x.cat_slug, x.vendor_id, x.business_name,
         x.verified, x.city,
         (select i.url from product_images i where i.product_id = x.id
           order by i.is_primary desc, i.sort_order limit 1),
         (select count(*)::int from terms where x.haystack like '%' || terms.t || '%') as match_score
  from candidates x
  where not exists (select 1 from terms)
     or exists (select 1 from terms where x.haystack like '%' || terms.t || '%')
  order by match_score desc, x.in_stock desc, x.verified desc, x.price nulls last
  limit least(greatest(coalesce(p_limit, 6), 1), 10);
$$;

create or replace function public.eco_guide_search_vendors(
  p_terms text[] default '{}',
  p_city text default null,
  p_capability text default null,
  p_limit int default 5
)
returns table (
  id uuid, business_name text, description text, city text, verified boolean,
  rating numeric, review_count int, logo_url text, capabilities text[],
  product_categories text[], published_products int, match_score int
)
language sql
stable
security invoker
set search_path = public
as $$
  with terms as (
    select lower(t) as t from unnest(coalesce(p_terms, '{}')) t where char_length(t) >= 2 limit 8
  ),
  v as (
    select ve.*,
      coalesce((select array_agg(distinct vc.capability::text) from vendor_capabilities vc where vc.vendor_id = ve.id), '{}') as caps,
      coalesce((select array_agg(distinct c.name) from products p join categories c on c.id = p.category_id
                 where p.vendor_id = ve.id and p.status = 'published'), '{}') as cats,
      (select count(*)::int from products p where p.vendor_id = ve.id and p.status = 'published') as n_products
    from vendors ve
    where ve.active
      and (p_city is null or ve.city ilike p_city || '%')
  ),
  scored as (
    select v.*, lower(concat_ws(' ', v.business_name, v.description, v.city,
                                array_to_string(v.caps, ' '), array_to_string(v.cats, ' '))) as haystack
    from v
    where p_capability is null or p_capability = any (v.caps)
  )
  select s.id, s.business_name, left(s.description, 300), s.city, s.verified, s.rating, s.review_count,
         s.logo_url, s.caps, s.cats, s.n_products,
         (select count(*)::int from terms where s.haystack like '%' || terms.t || '%')
  from scored s
  where not exists (select 1 from terms)
     or exists (select 1 from terms where s.haystack like '%' || terms.t || '%')
  order by 12 desc, s.verified desc, s.rating desc nulls last, s.n_products desc
  limit least(greatest(coalesce(p_limit, 5), 1), 10);
$$;

grant execute on function public.eco_guide_search_products(text[], text, numeric, numeric, int) to anon, authenticated, service_role;
grant execute on function public.eco_guide_search_vendors(text[], text, text, int) to anon, authenticated, service_role;
