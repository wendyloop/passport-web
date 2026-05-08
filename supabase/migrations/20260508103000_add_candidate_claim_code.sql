alter table public.candidate_invites
add column if not exists claim_code_hash text;

create unique index if not exists candidate_invites_claim_code_hash_key
on public.candidate_invites (claim_code_hash);
