alter table public.referrals
add column if not exists candidate_invite_status text not null default 'pending',
add column if not exists candidate_profile_status text not null default 'pending',
add column if not exists candidate_invited_at timestamptz,
add column if not exists candidate_claimed_at timestamptz,
add column if not exists candidate_profile_completed_at timestamptz;

create table if not exists public.candidate_invites (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null unique references public.referrals (id) on delete cascade,
  candidate_email text not null,
  candidate_name text not null,
  token_hash text not null unique,
  status text not null default 'pending',
  sent_at timestamptz,
  claimed_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint candidate_invites_status_check
    check (status in ('pending', 'sent', 'claimed', 'profile_completed', 'expired'))
);

create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique references public.candidate_invites (id) on delete cascade,
  referral_id uuid not null unique references public.referrals (id) on delete cascade,
  full_name text not null,
  email text not null,
  linkedin text,
  location text,
  preferred_roles text[] not null default '{}'::text[],
  intro_note text,
  consent_confirmed boolean not null default false,
  profile_status text not null default 'draft',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint candidate_profiles_status_check
    check (profile_status in ('draft', 'completed'))
);

create index if not exists candidate_invites_candidate_email_idx
on public.candidate_invites ((lower(candidate_email)));

create index if not exists candidate_profiles_email_idx
on public.candidate_profiles ((lower(email)));

drop trigger if exists set_candidate_invites_updated_at on public.candidate_invites;
create trigger set_candidate_invites_updated_at
before update on public.candidate_invites
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_candidate_profiles_updated_at on public.candidate_profiles;
create trigger set_candidate_profiles_updated_at
before update on public.candidate_profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.candidate_invites enable row level security;
alter table public.candidate_profiles enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.candidate_invites to service_role;
grant select, insert, update, delete on table public.candidate_profiles to service_role;
