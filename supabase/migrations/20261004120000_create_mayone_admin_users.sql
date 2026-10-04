begin;

create table if not exists public.mayone_admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.mayone_admin_users enable row level security;

revoke all on table public.mayone_admin_users from public, anon, authenticated;
grant select on table public.mayone_admin_users to service_role;

comment on table public.mayone_admin_users is
  'MAY.ONE admin allowlist keyed by Supabase Auth user ID; only trusted server code can read it.';

commit;
