create table if not exists public.kv_store_ff738703 (key text not null primary key, value jsonb not null);
alter table public.kv_store_ff738703 enable row level security;

create table if not exists public.kv_store_a5927615 (key text not null primary key, value jsonb not null);
alter table public.kv_store_a5927615 enable row level security;

create table if not exists public.user_access (
  id bigint generated always as identity primary key,
  user_id text not null,
  plan text not null default 'free',
  status text not null default 'inactive',
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project text,
  email text,
  unique (user_id, project)
);
alter table public.user_access enable row level security;
comment on table public.user_access is 'Доступы Рутины по подписке. Пишет только Edge Function (service role).';
