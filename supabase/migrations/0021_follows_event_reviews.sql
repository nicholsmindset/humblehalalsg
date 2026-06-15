-- 0021_follows_event_reviews.sql — Epic E: organiser follows + event ratings.

-- ── Organiser follows ─────────────────────────────────────────────────────────
-- A user follows a business (organiser) to keep up with their events.
create table if not exists organizer_follows (
  user_id uuid references profiles(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);
alter table organizer_follows enable row level security;
-- Users manage only their own follows.
drop policy if exists follows_select_own on organizer_follows;
create policy follows_select_own on organizer_follows for select using (auth.uid() = user_id);
drop policy if exists follows_insert_own on organizer_follows;
create policy follows_insert_own on organizer_follows for insert with check (auth.uid() = user_id);
drop policy if exists follows_delete_own on organizer_follows;
create policy follows_delete_own on organizer_follows for delete using (auth.uid() = user_id);

-- Public follower counts (no PII) via a SECURITY DEFINER function.
create or replace function public.follower_count(p_business_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from organizer_follows where business_id = p_business_id;
$$;

-- ── Event ratings ─────────────────────────────────────────────────────────────
-- Attendee ratings for events (moderated, like business reviews). Honest: only
-- published rows count toward the public average, and we never fabricate one.
create table if not exists event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  rating int not null check (rating between 1 and 5),
  text text,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists event_reviews_event_idx on event_reviews (event_id, status);
alter table event_reviews enable row level security;
-- No anon access to raw rows (moderation queue). Reads go through the API
-- (service role) / the published view below; writes go through the API.
drop policy if exists event_reviews_admin_read on event_reviews;
create policy event_reviews_admin_read on event_reviews for select using (public.is_admin());

-- Published reviews keyed by event slug (for detail pages).
create or replace view public.v_event_reviews_public as
  select er.id, er.event_id, e.slug as event_slug, er.rating, er.text, er.author_name, er.created_at
  from event_reviews er
  join events e on e.id = er.event_id
  where er.status = 'published';

-- Aggregate rating per event (published only).
create or replace view public.v_event_rating as
  select event_id,
         round(avg(rating)::numeric, 1) as avg_rating,
         count(*)::int as review_count
  from event_reviews
  where status = 'published'
  group by event_id;
