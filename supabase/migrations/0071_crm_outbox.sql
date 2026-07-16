-- 0071: transactional CRM outbox for the Convex operational sidecar.
-- Supabase remains the system of record. Triggers enqueue small, purpose-built
-- projections in the same transaction as each authoritative write; a guarded
-- cron claims and delivers them to Convex with idempotency keys.
--
-- Privacy: lead identity/contact fields leave Supabase only when the lead gave
-- contact consent. Non-consented leads are still represented as anonymous
-- pipeline records so operators can see workload without exporting PII.

create table if not exists public.crm_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('upsert', 'delete')),
  aggregate_type text not null check (aggregate_type in ('business', 'lead', 'lead_route')),
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  locked_at timestamptz,
  processed_at timestamptz,
  last_error text
);

create index if not exists crm_outbox_pending
  on public.crm_outbox (next_attempt_at, created_at)
  where processed_at is null;

create index if not exists crm_outbox_aggregate
  on public.crm_outbox (aggregate_type, aggregate_id, created_at desc);

alter table public.crm_outbox enable row level security;

drop policy if exists "crm_outbox admin read" on public.crm_outbox;
create policy "crm_outbox admin read" on public.crm_outbox
  for select to authenticated using (public.is_admin());

-- Atomically claims a batch. Expired locks become eligible again after ten
-- minutes, covering a terminated serverless invocation without losing events.
create or replace function public.claim_crm_outbox(p_limit integer default 50)
returns setof public.crm_outbox
language sql
security definer
set search_path = public
as $$
  update public.crm_outbox o
     set locked_at = now(),
         attempt_count = o.attempt_count + 1
   where o.id in (
     select q.id
       from public.crm_outbox q
      where q.processed_at is null
        and q.next_attempt_at <= now()
        and (q.locked_at is null or q.locked_at < now() - interval '10 minutes')
      order by q.created_at
      for update skip locked
      limit greatest(1, least(coalesce(p_limit, 50), 200))
   )
  returning o.*;
$$;

create or replace function public.complete_crm_outbox(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.crm_outbox
     set processed_at = now(), locked_at = null, last_error = null
   where id = p_id and processed_at is null;
$$;

create or replace function public.fail_crm_outbox(p_id uuid, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.crm_outbox
     set locked_at = null,
         last_error = left(coalesce(p_error, 'delivery_failed'), 500),
         next_attempt_at = now() + make_interval(
           secs => least(3600, greatest(15, (15 * power(2, least(attempt_count, 8)))::integer))
         )
   where id = p_id and processed_at is null;
$$;

revoke all on function public.claim_crm_outbox(integer) from public, anon, authenticated;
revoke all on function public.complete_crm_outbox(uuid) from public, anon, authenticated;
revoke all on function public.fail_crm_outbox(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_crm_outbox(integer) to service_role;
grant execute on function public.complete_crm_outbox(uuid) to service_role;
grant execute on function public.fail_crm_outbox(uuid, text) to service_role;

create or replace function public.crm_outbox_business_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare row_data record;
begin
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  insert into public.crm_outbox (event_type, aggregate_type, aggregate_id, payload)
  values (
    case when tg_op = 'DELETE' then 'delete' else 'upsert' end,
    'business', row_data.id,
    case when tg_op = 'DELETE' then jsonb_build_object('deleted', true)
    else jsonb_build_object(
      'name', row_data.name,
      'slug', row_data.slug,
      'categoryId', row_data.cat_id,
      'area', row_data.area,
      'ownerId', row_data.owner_id,
      'contactEmail', row_data.contact_email,
      'phone', row_data.phone,
      'plan', row_data.plan,
      'featured', row_data.featured,
      'createdAt', row_data.created_at
    ) end
  );
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create or replace function public.crm_outbox_lead_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare row_data record;
begin
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  insert into public.crm_outbox (event_type, aggregate_type, aggregate_id, payload)
  values (
    case when tg_op = 'DELETE' then 'delete' else 'upsert' end,
    'lead', row_data.id,
    case when tg_op = 'DELETE' then jsonb_build_object('deleted', true)
    else jsonb_build_object(
      'name', case when row_data.consent_contact then row_data.name else null end,
      'email', case when row_data.consent_contact then row_data.email else null end,
      'phone', case when row_data.consent_contact then row_data.phone else null end,
      'consentContact', row_data.consent_contact,
      'consentVersion', row_data.consent_version,
      'consentedAt', row_data.consented_at,
      'category', row_data.category,
      'verticalId', row_data.vertical_id,
      'area', row_data.area,
      'budget', row_data.budget,
      'eventDate', row_data.event_date,
      'status', row_data.status,
      'sourcePath', row_data.source_path,
      'createdAt', row_data.created_at,
      'routedAt', row_data.routed_at,
      'anonymizedAt', row_data.anonymized_at
    ) end
  );
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create or replace function public.crm_outbox_lead_route_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare row_data record;
begin
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  insert into public.crm_outbox (event_type, aggregate_type, aggregate_id, payload)
  values (
    case when tg_op = 'DELETE' then 'delete' else 'upsert' end,
    'lead_route', row_data.id,
    case when tg_op = 'DELETE' then jsonb_build_object('deleted', true)
    else jsonb_build_object(
      'leadId', row_data.lead_id,
      'businessId', row_data.business_id,
      'status', row_data.status,
      'mode', row_data.mode,
      'delivery', row_data.delivery,
      'sentAt', row_data.sent_at,
      'viewedAt', row_data.viewed_at,
      'acceptedAt', row_data.accepted_at,
      'outcomeAt', row_data.outcome_at,
      'expiresAt', row_data.expires_at,
      'deliveredAt', row_data.delivered_at
    ) end
  );
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists crm_business_change on public.businesses;
create trigger crm_business_change
  after insert or update or delete on public.businesses
  for each row execute function public.crm_outbox_business_change();

drop trigger if exists crm_lead_change on public.leads;
create trigger crm_lead_change
  after insert or update or delete on public.leads
  for each row execute function public.crm_outbox_lead_change();

drop trigger if exists crm_lead_route_change on public.lead_routes;
create trigger crm_lead_route_change
  after insert or update or delete on public.lead_routes
  for each row execute function public.crm_outbox_lead_route_change();

-- One-time/bootstrap snapshot. Inserts the same minimized projections directly
-- instead of touching source rows (so unrelated update triggers never fire).
create or replace function public.enqueue_crm_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare businesses_count integer; leads_count integer; routes_count integer;
begin
  insert into public.crm_outbox (event_type, aggregate_type, aggregate_id, payload)
  select 'upsert', 'business', b.id, jsonb_build_object(
    'name', b.name, 'slug', b.slug, 'categoryId', b.cat_id, 'area', b.area,
    'ownerId', b.owner_id, 'contactEmail', b.contact_email, 'phone', b.phone,
    'plan', b.plan, 'featured', b.featured, 'createdAt', b.created_at
  ) from public.businesses b;
  get diagnostics businesses_count = row_count;

  insert into public.crm_outbox (event_type, aggregate_type, aggregate_id, payload)
  select 'upsert', 'lead', l.id, jsonb_build_object(
    'name', case when l.consent_contact then l.name else null end,
    'email', case when l.consent_contact then l.email else null end,
    'phone', case when l.consent_contact then l.phone else null end,
    'consentContact', l.consent_contact, 'consentVersion', l.consent_version,
    'consentedAt', l.consented_at, 'category', l.category, 'verticalId', l.vertical_id,
    'area', l.area, 'budget', l.budget, 'eventDate', l.event_date,
    'status', l.status, 'sourcePath', l.source_path, 'createdAt', l.created_at,
    'routedAt', l.routed_at, 'anonymizedAt', l.anonymized_at
  ) from public.leads l;
  get diagnostics leads_count = row_count;

  insert into public.crm_outbox (event_type, aggregate_type, aggregate_id, payload)
  select 'upsert', 'lead_route', r.id, jsonb_build_object(
    'leadId', r.lead_id, 'businessId', r.business_id, 'status', r.status,
    'mode', r.mode, 'delivery', r.delivery, 'sentAt', r.sent_at,
    'viewedAt', r.viewed_at, 'acceptedAt', r.accepted_at, 'outcomeAt', r.outcome_at,
    'expiresAt', r.expires_at, 'deliveredAt', r.delivered_at
  ) from public.lead_routes r;
  get diagnostics routes_count = row_count;
  return jsonb_build_object(
    'businesses', businesses_count,
    'leads', leads_count,
    'leadRoutes', routes_count
  );
end;
$$;

revoke all on function public.enqueue_crm_snapshot() from public, anon, authenticated;
grant execute on function public.enqueue_crm_snapshot() to service_role;
