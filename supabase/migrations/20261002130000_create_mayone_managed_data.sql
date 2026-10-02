begin;

create table if not exists public.mayone_branches (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mayone_class_offers (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mayone_enrollments (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'submissionId' = id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mayone_branches enable row level security;
alter table public.mayone_class_offers enable row level security;
alter table public.mayone_enrollments enable row level security;

revoke all on table public.mayone_branches from public, anon, authenticated;
revoke all on table public.mayone_class_offers from public, anon, authenticated;
revoke all on table public.mayone_enrollments from public, anon, authenticated;

grant select, insert, update, delete on table public.mayone_branches to service_role;
grant select, insert, update, delete on table public.mayone_class_offers to service_role;
grant select, insert, update, delete on table public.mayone_enrollments to service_role;

comment on table public.mayone_branches is 'MAY.ONE branch directory records; accessed only by the server-side application.';
comment on table public.mayone_class_offers is 'MAY.ONE class offers; accessed only by the server-side application.';
comment on table public.mayone_enrollments is 'MAY.ONE demo application records; contains personal data and is server-only.';

commit;
