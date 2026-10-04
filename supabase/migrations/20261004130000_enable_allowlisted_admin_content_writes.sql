begin;

create table if not exists public.mayone_admin_emails (
  email text primary key check (email = lower(btrim(email)) and length(email) <= 254),
  created_at timestamptz not null default now()
);

alter table public.mayone_admin_emails enable row level security;
revoke all on table public.mayone_admin_emails from public, anon, authenticated;
grant select, insert, update, delete on table public.mayone_admin_emails to service_role;

revoke all on table public.mayone_branches, public.mayone_class_offers, public.mayone_enrollments from public, anon, authenticated;
grant select, insert, update, delete on table public.mayone_branches to service_role;
grant select, insert, update, delete on table public.mayone_class_offers to service_role;
grant select, insert, update, delete on table public.mayone_enrollments to service_role;

insert into public.mayone_admin_emails (email)
values
  ('xodn1311@naver.com'),
  ('dslee1311@naver.com'),
  ('jjcoin2@gmail.com')
on conflict (email) do nothing;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_mayone_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.mayone_admin_emails as allowed
      where allowed.email = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    );
$$;

revoke all on function private.is_mayone_admin() from public, anon;
grant execute on function private.is_mayone_admin() to authenticated;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('mayone_branches', 'mayone_class_offers', 'mayone_enrollments')
  loop
    execute format('drop policy %I on %I.%I', existing_policy.policyname, existing_policy.schemaname, existing_policy.tablename);
  end loop;
end;
$$;

grant select, insert, update on table public.mayone_branches to authenticated;
grant select, insert, update on table public.mayone_class_offers to authenticated;
revoke delete on table public.mayone_branches from authenticated;
revoke delete on table public.mayone_class_offers from authenticated;

drop policy if exists mayone_branches_admin_select on public.mayone_branches;
drop policy if exists mayone_branches_admin_insert on public.mayone_branches;
drop policy if exists mayone_branches_admin_update on public.mayone_branches;
create policy mayone_branches_admin_select
  on public.mayone_branches for select to authenticated
  using ((select private.is_mayone_admin()));
create policy mayone_branches_admin_insert
  on public.mayone_branches for insert to authenticated
  with check ((select private.is_mayone_admin()));
create policy mayone_branches_admin_update
  on public.mayone_branches for update to authenticated
  using ((select private.is_mayone_admin()))
  with check ((select private.is_mayone_admin()));

drop policy if exists mayone_class_offers_admin_select on public.mayone_class_offers;
drop policy if exists mayone_class_offers_admin_insert on public.mayone_class_offers;
drop policy if exists mayone_class_offers_admin_update on public.mayone_class_offers;
create policy mayone_class_offers_admin_select
  on public.mayone_class_offers for select to authenticated
  using ((select private.is_mayone_admin()));
create policy mayone_class_offers_admin_insert
  on public.mayone_class_offers for insert to authenticated
  with check ((select private.is_mayone_admin()));
create policy mayone_class_offers_admin_update
  on public.mayone_class_offers for update to authenticated
  using ((select private.is_mayone_admin()))
  with check ((select private.is_mayone_admin()));

comment on table public.mayone_admin_emails is
  'MAY.ONE production admin email allowlist; readable only by trusted server code and the RLS policy function.';
comment on function private.is_mayone_admin() is
  'Checks the signed Supabase Auth email claim against the server-managed MAY.ONE admin allowlist.';

commit;
