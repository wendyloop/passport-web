alter table public.referrals
add column if not exists company_site text;

create index if not exists referrals_company_site_idx
on public.referrals ((lower(company_site)));
