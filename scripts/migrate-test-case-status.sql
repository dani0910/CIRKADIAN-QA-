alter table public.test_cases
  drop constraint if exists test_cases_status_check;

alter table public.test_cases
  add constraint test_cases_status_check
  check (status in ('PASS', 'FAIL', 'UNTESTED', 'POLICY_REVIEW'));
