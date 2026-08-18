-- 第一步：创建管理员名单和安全检查函数（只需执行一次）
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

grant select, update, delete on public.feedback to authenticated;

drop policy if exists "管理员读取留言" on public.feedback;
create policy "管理员读取留言" on public.feedback
for select to authenticated using (public.is_admin());

drop policy if exists "管理员更新留言" on public.feedback;
create policy "管理员更新留言" on public.feedback
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "管理员删除留言" on public.feedback;
create policy "管理员删除留言" on public.feedback
for delete to authenticated using (public.is_admin());

-- 第二步：在 Supabase Authentication 中创建用户后，单独执行：
-- insert into public.admin_users(user_id)
-- select id from auth.users where email = '替换为你的管理员邮箱';
