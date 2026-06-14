-- Humble Halal — shareable per-vendor scorecard links (adapted from
-- dashboard.zip's 003). A vendor opens /scorecard/<token> and sees ONLY their
-- own numbers, no login. Keyed on LISTING SLUG (see 0010), and uses the shared
-- is_admin() helper. Run after 0010–0011.
--
-- Security model:
--   * Each token maps to exactly one listing_slug.
--   * vendor_scorecard_by_token(token,…) resolves the slug and returns only that
--     listing's aggregates — never another vendor's, never session-level rows.
--   * Tokens are revocable (active flag) and optionally expire.
--   * analytics_events stays admin-only (0010).

create table if not exists public.vendor_share_tokens (
  token        text primary key default encode(gen_random_bytes(18), 'hex'),
  listing_slug text not null,
  vendor_name  text not null,
  category     text,
  active       boolean not null default true,
  expires_at   timestamptz,                 -- null = never
  created_at   timestamptz not null default now(),
  last_viewed  timestamptz
);

create index if not exists idx_vst_slug on public.vendor_share_tokens (listing_slug);

alter table public.vendor_share_tokens enable row level security;

-- Only admins can list/create/manage tokens directly.
drop policy if exists "admins manage tokens" on public.vendor_share_tokens;
create policy "admins manage tokens"
  on public.vendor_share_tokens
  for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- Admin helper: mint a token for a listing slug.
create or replace function public.admin_create_share_token(
  p_listing_slug text,
  p_vendor_name  text,
  p_category     text default null,
  p_expires_at   timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_token text;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  insert into public.vendor_share_tokens (listing_slug, vendor_name, category, expires_at)
  values (p_listing_slug, p_vendor_name, p_category, p_expires_at)
  returning token into v_token;
  return v_token;
end;
$$;

revoke all on function public.admin_create_share_token(text,text,text,timestamptz) from public;
grant execute on function public.admin_create_share_token(text,text,text,timestamptz) to authenticated;

-- Public RPC: vendor scorecard by token, scoped to one date window.
-- Returns ONLY aggregate counts for the one listing the token maps to.
create or replace function public.vendor_scorecard_by_token(
  p_token text,
  p_from  timestamptz,
  p_to    timestamptz
)
returns table (
  vendor_name      text,
  category         text,
  enquiries        bigint,
  whatsapp_clicks  bigint,
  calls            bigint,
  website_clicks   bigint,
  directions       bigint,
  shortlists       bigint,
  listing_views    bigint,
  impressions      bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_name text;
  v_cat  text;
begin
  select listing_slug, vendor_name, category
    into v_slug, v_name, v_cat
  from public.vendor_share_tokens
  where token = p_token
    and active = true
    and (expires_at is null or expires_at > now());

  if v_slug is null then
    raise exception 'invalid or expired token';
  end if;

  update public.vendor_share_tokens set last_viewed = now() where token = p_token;

  return query
  select
    v_name, v_cat,
    count(*) filter (where lead_action_type = 'enquiry_form')::bigint,
    count(*) filter (where lead_action_type = 'whatsapp')::bigint,
    count(*) filter (where lead_action_type = 'call')::bigint,
    count(*) filter (where lead_action_type = 'website')::bigint,
    count(*) filter (where lead_action_type = 'directions')::bigint,
    count(*) filter (where lead_action_type = 'shortlist')::bigint,
    count(*) filter (where event_type = 'listing_view')::bigint,
    count(*) filter (where event_type = 'impression')::bigint
  from public.analytics_events
  where listing_slug = v_slug
    and created_at >= p_from and created_at < p_to;
end;
$$;

revoke all on function public.vendor_scorecard_by_token(text,timestamptz,timestamptz) from public;
grant execute on function public.vendor_scorecard_by_token(text,timestamptz,timestamptz) to anon, authenticated;
