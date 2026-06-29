alter table public.tc_details
  add column if not exists fail_type text null;

alter table public.tc_details
  drop column if exists policy_review_note,
  drop column if exists review_note;

alter table public.tc_details
  drop constraint if exists tc_details_fail_type_check;

alter table public.tc_details
  add constraint tc_details_fail_type_check
  check (fail_type is null or fail_type in ('BUG', 'UX_ISSUE'));

create table if not exists public.tc_comments (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid not null references public.test_cases(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.tc_comments
  drop column if exists role;

create index if not exists tc_comments_test_case_created_at_idx
  on public.tc_comments(test_case_id, created_at);
