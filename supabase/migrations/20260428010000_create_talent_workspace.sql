create extension if not exists vector;

create table if not exists public.talent_import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  source_mode text not null check (source_mode in ('individual_resume', 'combined_pdf')),
  source_filename text not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  total_items integer not null default 0,
  completed_items integer not null default 0,
  failed_items integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.talent_profiles (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid references public.talent_import_jobs (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  full_name text,
  email text,
  linkedin text,
  schools text[] not null default '{}'::text[],
  companies text[] not null default '{}'::text[],
  most_recent_role text,
  summary text,
  resume_text text,
  search_text text not null default '',
  source_type text not null check (source_type in ('individual_resume', 'combined_pdf_page', 'application_form')),
  source_filename text not null,
  source_resume_path text not null,
  source_page_number integer,
  parse_status text not null default 'pending' check (parse_status in ('pending', 'completed', 'failed')),
  parse_error text,
  embedding vector(1536),
  embedding_model text,
  parser_model text,
  parser_version text,
  parsed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.talent_import_items (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.talent_import_jobs (id) on delete cascade,
  talent_profile_id uuid references public.talent_profiles (id) on delete set null,
  storage_path text not null,
  source_filename text not null,
  source_page_number integer,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.talent_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  query text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.talent_profile_tags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.talent_profiles (id) on delete cascade,
  label text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.talent_profile_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.talent_profiles (id) on delete cascade,
  author_user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.talent_employer_actions (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references public.profiles (id) on delete cascade,
  talent_profile_id uuid not null references public.talent_profiles (id) on delete cascade,
  shortlisted boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint talent_employer_actions_unique unique (employer_user_id, talent_profile_id)
);

create index if not exists talent_profiles_created_at_idx on public.talent_profiles (created_at desc);
create index if not exists talent_profiles_parse_status_idx on public.talent_profiles (parse_status, created_at desc);
create index if not exists talent_profiles_source_type_idx on public.talent_profiles (source_type, created_at desc);
create index if not exists talent_profiles_name_idx on public.talent_profiles ((lower(coalesce(full_name, ''))));
create index if not exists talent_import_items_job_idx on public.talent_import_items (import_job_id, created_at desc);
create index if not exists talent_profile_notes_profile_idx on public.talent_profile_notes (profile_id, created_at desc);
create index if not exists talent_profile_tags_profile_idx on public.talent_profile_tags (profile_id, created_at desc);
create unique index if not exists talent_profile_tags_unique_idx
  on public.talent_profile_tags (profile_id, lower(label));
create index if not exists talent_employer_actions_profile_idx on public.talent_employer_actions (talent_profile_id, updated_at desc);

drop trigger if exists set_talent_import_jobs_updated_at on public.talent_import_jobs;
create trigger set_talent_import_jobs_updated_at
before update on public.talent_import_jobs
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_talent_profiles_updated_at on public.talent_profiles;
create trigger set_talent_profiles_updated_at
before update on public.talent_profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_talent_import_items_updated_at on public.talent_import_items;
create trigger set_talent_import_items_updated_at
before update on public.talent_import_items
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_talent_saved_searches_updated_at on public.talent_saved_searches;
create trigger set_talent_saved_searches_updated_at
before update on public.talent_saved_searches
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_talent_profile_tags_updated_at on public.talent_profile_tags;
create trigger set_talent_profile_tags_updated_at
before update on public.talent_profile_tags
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_talent_profile_notes_updated_at on public.talent_profile_notes;
create trigger set_talent_profile_notes_updated_at
before update on public.talent_profile_notes
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_talent_employer_actions_updated_at on public.talent_employer_actions;
create trigger set_talent_employer_actions_updated_at
before update on public.talent_employer_actions
for each row
execute procedure public.set_current_timestamp_updated_at();

create or replace function public.build_talent_search_text(
  full_name text,
  schools text[],
  companies text[],
  most_recent_role text,
  summary text,
  resume_text text
)
returns text
language sql
immutable
as $$
  select trim(
    concat_ws(
      ' ',
      coalesce(full_name, ''),
      coalesce(array_to_string(schools, ' '), ''),
      coalesce(array_to_string(companies, ' '), ''),
      coalesce(most_recent_role, ''),
      coalesce(summary, ''),
      coalesce(resume_text, '')
    )
  );
$$;

create or replace function public.search_talent_profiles(
  query_embedding vector(1536),
  match_count integer default 24,
  school_filters text[] default '{}'::text[],
  company_filters text[] default '{}'::text[],
  role_filters text[] default '{}'::text[]
)
returns table (
  id uuid,
  full_name text,
  email text,
  linkedin text,
  schools text[],
  companies text[],
  most_recent_role text,
  summary text,
  source_type text,
  source_filename text,
  source_resume_path text,
  source_page_number integer,
  parse_status text,
  similarity double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profile.id,
    profile.full_name,
    profile.email,
    profile.linkedin,
    profile.schools,
    profile.companies,
    profile.most_recent_role,
    profile.summary,
    profile.source_type,
    profile.source_filename,
    profile.source_resume_path,
    profile.source_page_number,
    profile.parse_status,
    case
      when query_embedding is null or profile.embedding is null then 0::double precision
      else (1 - (profile.embedding <=> query_embedding))::double precision
    end as similarity
  from public.talent_profiles profile
  where profile.parse_status = 'completed'
    and (
      coalesce(array_length(school_filters, 1), 0) = 0
      or exists (
        select 1
        from unnest(profile.schools) as school, unnest(school_filters) as filter_value
        where lower(school) like '%' || lower(filter_value) || '%'
      )
    )
    and (
      coalesce(array_length(company_filters, 1), 0) = 0
      or exists (
        select 1
        from unnest(profile.companies) as company, unnest(company_filters) as filter_value
        where lower(company) like '%' || lower(filter_value) || '%'
      )
    )
    and (
      coalesce(array_length(role_filters, 1), 0) = 0
      or exists (
        select 1
        from unnest(role_filters) as filter_value
        where lower(coalesce(profile.most_recent_role, '')) like '%' || lower(filter_value) || '%'
      )
    )
  order by
    case when query_embedding is null or profile.embedding is null then 1 else 0 end,
    case
      when query_embedding is null or profile.embedding is null then 0::double precision
      else (profile.embedding <=> query_embedding)::double precision
    end,
    profile.created_at desc
  limit greatest(match_count, 1);
$$;

alter table public.talent_import_jobs enable row level security;
alter table public.talent_profiles enable row level security;
alter table public.talent_import_items enable row level security;
alter table public.talent_saved_searches enable row level security;
alter table public.talent_profile_tags enable row level security;
alter table public.talent_profile_notes enable row level security;
alter table public.talent_employer_actions enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'talent-resumes',
  'talent-resumes',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select on table public.talent_profiles to authenticated;
grant select, insert, update on table public.talent_import_jobs to authenticated;
grant select on table public.talent_import_items to authenticated;
grant select, insert, update, delete on table public.talent_saved_searches to authenticated;
grant select, insert, update, delete on table public.talent_profile_tags to authenticated;
grant select, insert on table public.talent_profile_notes to authenticated;
grant select, insert, update on table public.talent_employer_actions to authenticated;
grant execute on function public.search_talent_profiles(vector, integer, text[], text[], text[]) to authenticated;

drop policy if exists "portal users can read talent profiles" on public.talent_profiles;
create policy "portal users can read talent profiles"
on public.talent_profiles
for select
to authenticated
using (public.has_portal_access());

drop policy if exists "admins can manage talent import jobs" on public.talent_import_jobs;
create policy "admins can manage talent import jobs"
on public.talent_import_jobs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can read talent import items" on public.talent_import_items;
create policy "admins can read talent import items"
on public.talent_import_items
for select
to authenticated
using (public.is_admin());

drop policy if exists "users can manage own saved searches" on public.talent_saved_searches;
create policy "users can manage own saved searches"
on public.talent_saved_searches
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "portal users can read talent tags" on public.talent_profile_tags;
create policy "portal users can read talent tags"
on public.talent_profile_tags
for select
to authenticated
using (public.has_portal_access());

drop policy if exists "admins can manage talent tags" on public.talent_profile_tags;
create policy "admins can manage talent tags"
on public.talent_profile_tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "portal users can read talent notes" on public.talent_profile_notes;
create policy "portal users can read talent notes"
on public.talent_profile_notes
for select
to authenticated
using (public.has_portal_access());

drop policy if exists "admins can insert talent notes" on public.talent_profile_notes;
create policy "admins can insert talent notes"
on public.talent_profile_notes
for insert
to authenticated
with check (public.is_admin() and author_user_id = auth.uid());

drop policy if exists "admins can read all talent employer actions" on public.talent_employer_actions;
create policy "admins can read all talent employer actions"
on public.talent_employer_actions
for select
to authenticated
using (public.is_admin());

drop policy if exists "employers can read own talent employer actions" on public.talent_employer_actions;
create policy "employers can read own talent employer actions"
on public.talent_employer_actions
for select
to authenticated
using (public.is_employer() and employer_user_id = auth.uid());

drop policy if exists "employers can upsert own talent employer actions" on public.talent_employer_actions;
create policy "employers can upsert own talent employer actions"
on public.talent_employer_actions
for insert
to authenticated
with check (public.is_employer() and employer_user_id = auth.uid());

drop policy if exists "employers can update own talent employer actions" on public.talent_employer_actions;
create policy "employers can update own talent employer actions"
on public.talent_employer_actions
for update
to authenticated
using (public.is_employer() and employer_user_id = auth.uid())
with check (public.is_employer() and employer_user_id = auth.uid());

drop policy if exists "portal users can view talent resumes" on storage.objects;
create policy "portal users can view talent resumes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'talent-resumes'
  and public.has_portal_access()
);

drop policy if exists "admins can upload talent resumes" on storage.objects;
create policy "admins can upload talent resumes"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'talent-resumes'
  and public.is_admin()
);
