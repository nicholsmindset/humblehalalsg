-- Humble Halal — admin user directory RPC.
-- Lets the admin console list real users (auth.users + their profile role/name)
-- instead of a hardcoded demo table. SECURITY DEFINER so it can read auth.users,
-- guarded by is_admin() (0010) so only admins get anything. Run after 0017.
-- Idempotent.

create or replace function public.admin_list_users(p_limit int default 200)
returns table (
  id         uuid,
  email      text,
  name       text,
  role       text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select u.id, u.email::text, p.name, coalesce(p.role, 'user'), u.created_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc
    limit greatest(1, least(p_limit, 1000));
end;
$$;

revoke all on function public.admin_list_users(int) from public;
grant execute on function public.admin_list_users(int) to authenticated;
