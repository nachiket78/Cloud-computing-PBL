-- Aegis schema. Run this once in the Supabase SQL editor.
-- The API uses the service role and bypasses RLS. These policies still
-- block the anon and authenticated keys from reading other people's files.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  role text not null check (role in ('reporter', 'reviewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  category text not null check (category in ('Safety', 'Maintenance', 'Facilities', 'Network', 'Other')),
  severity text not null check (severity in ('low', 'medium', 'high')),
  description text not null check (char_length(description) between 10 and 4000),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved')),
  file_path text,
  file_name text,
  file_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('created', 'status_changed')),
  note text check (note is null or char_length(note) <= 1000),
  from_status text check (from_status is null or from_status in ('open', 'investigating', 'resolved')),
  to_status text check (to_status is null or to_status in ('open', 'investigating', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists incidents_owner_updated_idx
  on public.incidents (owner_id, updated_at desc);

create index if not exists incidents_updated_idx
  on public.incidents (updated_at desc);

create index if not exists audit_log_created_idx
  on public.audit_log (created_at desc);

create index if not exists audit_log_incident_idx
  on public.audit_log (incident_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists incidents_set_updated_at on public.incidents;
create trigger incidents_set_updated_at
  before update on public.incidents
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role text;
begin
  chosen_role := case
    when new.raw_user_meta_data->>'role' = 'reviewer' then 'reviewer'
    else 'reporter'
  end;

  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    chosen_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_role() = 'reviewer');

drop policy if exists incidents_select on public.incidents;
create policy incidents_select on public.incidents
  for select to authenticated
  using (owner_id = auth.uid() or public.current_role() = 'reviewer');

drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log
  for select to authenticated
  using (
    public.current_role() = 'reviewer'
    or actor_id = auth.uid()
    or exists (
      select 1 from public.incidents i
      where i.id = incident_id and i.owner_id = auth.uid()
    )
  );

grant usage on schema public to authenticated;
grant select on public.profiles, public.incidents, public.audit_log to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No storage policies are created on purpose. Without an allow policy,
-- the browser cannot read the evidence bucket. The API uses the service
-- role and returns a short-lived signed URL after it checks the role.
