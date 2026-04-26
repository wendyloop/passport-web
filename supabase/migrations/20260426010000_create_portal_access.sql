create type public.portal_role as enum ('admin', 'employer');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.portal_roles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role public.portal_role not null,
  company_name text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.employer_candidate_actions (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  shortlisted boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint employer_candidate_actions_unique unique (employer_user_id, application_id)
);

create index if not exists employer_candidate_actions_application_idx
  on public.employer_candidate_actions (application_id, updated_at desc);

create index if not exists employer_candidate_actions_employer_idx
  on public.employer_candidate_actions (employer_user_id, updated_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_portal_roles_updated_at on public.portal_roles;
create trigger set_portal_roles_updated_at
before update on public.portal_roles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_employer_candidate_actions_updated_at on public.employer_candidate_actions;
create trigger set_employer_candidate_actions_updated_at
before update on public.employer_candidate_actions
for each row
execute procedure public.set_current_timestamp_updated_at();

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute procedure public.handle_new_profile();

insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
from auth.users
where email is not null
on conflict (id) do update
set email = excluded.email;

create or replace function public.has_portal_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portal_roles
    where user_id = auth.uid()
  );
$$;

create or replace function public.current_portal_role()
returns public.portal_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.portal_roles
  where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_portal_role() = 'admin'::public.portal_role;
$$;

create or replace function public.is_employer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_portal_role() = 'employer'::public.portal_role;
$$;

alter table public.profiles enable row level security;
alter table public.portal_roles enable row level security;
alter table public.employer_candidate_actions enable row level security;

grant usage on schema public to authenticated;
grant select on table public.applications to authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.portal_roles to authenticated;
grant select, insert, update on table public.employer_candidate_actions to authenticated;

drop policy if exists "portal users can read applications" on public.applications;
create policy "portal users can read applications"
on public.applications
for select
to authenticated
using (public.has_portal_access());

drop policy if exists "users can read own profile and admins can read all" on public.profiles;
create policy "users can read own profile and admins can read all"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users can read own role and admins can read all roles" on public.portal_roles;
create policy "users can read own role and admins can read all roles"
on public.portal_roles
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins can read all employer actions" on public.employer_candidate_actions;
create policy "admins can read all employer actions"
on public.employer_candidate_actions
for select
to authenticated
using (public.is_admin());

drop policy if exists "employers can read own candidate actions" on public.employer_candidate_actions;
create policy "employers can read own candidate actions"
on public.employer_candidate_actions
for select
to authenticated
using (public.is_employer() and employer_user_id = auth.uid());

drop policy if exists "employers can insert own candidate actions" on public.employer_candidate_actions;
create policy "employers can insert own candidate actions"
on public.employer_candidate_actions
for insert
to authenticated
with check (public.is_employer() and employer_user_id = auth.uid());

drop policy if exists "employers can update own candidate actions" on public.employer_candidate_actions;
create policy "employers can update own candidate actions"
on public.employer_candidate_actions
for update
to authenticated
using (public.is_employer() and employer_user_id = auth.uid())
with check (public.is_employer() and employer_user_id = auth.uid());

drop policy if exists "portal users can view resume and video objects" on storage.objects;
create policy "portal users can view resume and video objects"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('resumes', 'videos')
  and public.has_portal_access()
);
