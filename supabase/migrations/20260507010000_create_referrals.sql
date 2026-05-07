create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  company_name text not null,
  referrer_name text not null,
  referrer_email text not null,
  yc_batch text not null,
  candidate_name text not null,
  candidate_email text not null,
  role_interviewed_for text not null,
  round_reached text not null,
  why_not_hire text not null,
  exceptional_why text not null,
  strengths text[] not null default '{}'::text[],
  founders_note text not null
);

create index if not exists referrals_created_at_idx on public.referrals (created_at desc);
create index if not exists referrals_referrer_email_idx on public.referrals ((lower(referrer_email)));
create index if not exists referrals_candidate_email_idx on public.referrals ((lower(candidate_email)));

drop trigger if exists set_referrals_updated_at on public.referrals;
create trigger set_referrals_updated_at
before update on public.referrals
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.referrals enable row level security;

grant usage on schema public to service_role;
grant insert, select on table public.referrals to service_role;
