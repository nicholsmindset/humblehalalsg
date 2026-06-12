-- Auth wiring: auto-create profiles for new users, audit trail for admin
-- actions, and an RLS policy that actually lets admins update businesses
-- (0001 only granted owners; the admin console's RLS-scoped update would
-- silently fail even for a real admin).

-- ── profiles auto-provisioning ────────────────────────────────────────────────
-- Role comes from signup metadata but is coerced to user/owner; admin is only
-- ever granted manually:  update profiles set role = 'admin' where id = '…';
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, role, name)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'owner' then 'owner' else 'user' end,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── audit log (admin/verify already best-effort inserts into this) ────────────
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id) on delete set null,
  action text not null,
  business_id text,
  detail text,
  created_at timestamptz not null default now()
);
alter table audit_log enable row level security;  -- service-role only

-- ── admin write access on businesses ──────────────────────────────────────────
create policy "admin update businesses" on businesses for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
