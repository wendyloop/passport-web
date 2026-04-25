create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  submitted_at timestamptz,
  name text not null,
  email text not null,
  linkedin text,
  interview_categories text[] not null default '{}'::text[],
  interview_details text,
  resume_path text not null,
  video_path text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewing', 'archived')),
  resume_parse_status text not null default 'pending' check (resume_parse_status in ('pending', 'completed', 'failed')),
  resume_parse_error text,
  schools text[] not null default '{}'::text[],
  companies text[] not null default '{}'::text[],
  most_recent_role text,
  resume_parser_model text,
  resume_parser_version text,
  resume_parse_raw jsonb,
  resume_parsed_at timestamptz
);

create index if not exists applications_created_at_idx on public.applications (created_at desc);
create index if not exists applications_email_idx on public.applications ((lower(email)));
create index if not exists applications_status_idx on public.applications (status, resume_parse_status);

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.applications enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit)
values (
  'videos',
  'videos',
  false,
  209715200
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;
