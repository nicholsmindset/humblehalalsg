-- Humble Halal — owner review management (Phase 1).
-- Lets a business owner see ALL reviews on their listings (incl. pending) and
-- reply to them. Both RPCs are SECURITY DEFINER but hard-scoped to listings the
-- caller owns (businesses.owner_id / claimed_by = auth.uid()). Run after 0013.
-- (0014 is reserved for the separate events-display work.)

-- All reviews for the caller's listings, newest first.
create or replace function public.owner_reviews()
returns table (
  id            uuid,
  listing_slug  text,
  business_name text,
  rating        int,
  text          text,
  reply         text,
  status        text,
  created_at    timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, b.slug, b.name, r.rating, r.text, r.reply, r.status, r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  where b.owner_id = auth.uid() or b.claimed_by = auth.uid()
  order by r.created_at desc;
$$;

revoke all on function public.owner_reviews() from public;
grant execute on function public.owner_reviews() to authenticated;

-- Reply to one review — only if it belongs to a listing the caller owns.
create or replace function public.owner_reply_to_review(
  p_review_id uuid,
  p_reply     text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reviews
     set reply = p_reply, replied_at = now()
   where id = p_review_id
     and business_id in (
       select id from public.businesses
       where owner_id = auth.uid() or claimed_by = auth.uid()
     );
  if not found then
    raise exception 'not your review';
  end if;
end;
$$;

revoke all on function public.owner_reply_to_review(uuid, text) from public;
grant execute on function public.owner_reply_to_review(uuid, text) to authenticated;
