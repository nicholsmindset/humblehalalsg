-- 0040: booking idempotency + ad-event integrity (pre-production audit).
--
-- 1) Replay-proof the booking ledgers. bookFlight/book are idempotent at
--    LiteAPI, but a double-submitted (or replayed) prebook/transaction inserted
--    DUPLICATE hotel_bookings / flight_bookings / hotel_commissions rows —
--    duplicate "My Trips" entries, duplicate confirmation emails and
--    double-counted commission revenue. Unique indexes make the DB the
--    backstop; the book routes treat 23505 as "replay" and skip the
--    commission insert + email.
--    (Partial WHERE NOT NULL: legacy/simulated rows may lack these ids.)

-- Dedupe any rows that already violate the constraints (keep the oldest).
delete from hotel_commissions hc using hotel_commissions older
  where hc.booking_id = older.booking_id
    and (hc.created_at, hc.id) > (older.created_at, older.id);
delete from hotel_bookings hb using hotel_bookings older
  where hb.liteapi_booking_id is not null
    and hb.liteapi_booking_id = older.liteapi_booking_id
    and (hb.created_at, hb.id) > (older.created_at, older.id);
delete from flight_bookings fb using flight_bookings older
  where fb.prebook_id is not null
    and fb.prebook_id = older.prebook_id
    and (fb.created_at, fb.id) > (older.created_at, older.id);

create unique index if not exists hotel_bookings_liteapi_id_uq
  on hotel_bookings (liteapi_booking_id) where liteapi_booking_id is not null;
create unique index if not exists flight_bookings_prebook_uq
  on flight_bookings (prebook_id) where prebook_id is not null;
create unique index if not exists hotel_commissions_booking_uq
  on hotel_commissions (booking_id);

-- 2) track_ad_event: only count events for campaigns that exist, are ACTIVE
--    and are within their run window. The FK already rejected nonexistent ids,
--    but paused/expired/pending campaigns could have impressions/clicks
--    inflated by anyone posting a known campaign id to /api/ads/track.
create or replace function public.track_ad_event(p_campaign uuid, p_placement text, p_kind text, p_session text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('impression', 'click') then return; end if;
  if not exists (
    select 1 from ad_campaigns c
    where c.id = p_campaign
      and c.status = 'active'
      and (c.starts_on is null or c.starts_on <= current_date)
      and (c.ends_on is null or c.ends_on >= current_date)
  ) then return; end if;
  insert into ad_events (campaign_id, placement_key, kind, session_id)
  values (p_campaign, p_placement, p_kind, left(coalesce(p_session, ''), 64));
end;
$$;
