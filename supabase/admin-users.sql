-- 在 Supabase SQL Editor 中整份执行一次
-- 依赖 public.is_admin()（见 supabase/admin-policies.sql）

create table if not exists public.user_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_disabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.user_flags enable row level security;
revoke all on public.user_flags from anon, authenticated;

create or replace function public.admin_list_users()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not public.is_admin() then
    raise insufficient_privilege;
  end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
  into result
  from (
    select
      u.id,
      u.email,
      coalesce(nullif(u.raw_user_meta_data->>'name', ''), split_part(coalesce(u.email, ''), '@', 1)) as name,
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at,
      exists (select 1 from public.admin_users a where a.user_id = u.id) as is_admin,
      coalesce(f.is_disabled, false) as is_disabled
    from auth.users u
    left join public.user_flags f on f.user_id = u.id
  ) t;
  return result;
end;
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_set_user_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise insufficient_privilege;
  end if;
  if p_user_id is null then
    raise exception 'invalid user';
  end if;
  if p_user_id = auth.uid() and not p_is_admin then
    raise exception '不能取消自己的管理员权限';
  end if;
  if p_is_admin then
    insert into public.admin_users(user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  else
    delete from public.admin_users where user_id = p_user_id;
  end if;
end;
$$;
revoke all on function public.admin_set_user_admin(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated;

create or replace function public.admin_set_user_disabled(p_user_id uuid, p_disabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise insufficient_privilege;
  end if;
  if p_user_id is null then
    raise exception 'invalid user';
  end if;
  if p_user_id = auth.uid() and p_disabled then
    raise exception '不能停用当前登录的管理员';
  end if;
  insert into public.user_flags(user_id, is_disabled, updated_at)
  values (p_user_id, coalesce(p_disabled, false), now())
  on conflict (user_id) do update
    set is_disabled = excluded.is_disabled,
        updated_at = now();
end;
$$;
revoke all on function public.admin_set_user_disabled(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_disabled(uuid, boolean) to authenticated;

create or replace function public.account_is_disabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select is_disabled from public.user_flags where user_id = auth.uid()
  ), false);
$$;
revoke all on function public.account_is_disabled() from public, anon;
grant execute on function public.account_is_disabled() to authenticated;
