alter table public.category_groups
  drop constraint if exists category_groups_parent_id_fkey;

drop index if exists public.category_groups_project_parent_order_idx;

alter table public.category_groups
  drop column if exists parent_id;

alter table public.category_groups
  add column parent_id uuid null;

alter table public.category_groups
  add column if not exists test_category text null;

alter table public.category_groups
  add column if not exists display_order integer null;

alter table public.category_groups
  add constraint category_groups_parent_id_fkey
  foreign key (parent_id)
  references public.category_groups(id)
  on delete cascade;

create index if not exists category_groups_project_parent_order_idx
  on public.category_groups(project_id, parent_id, display_order);
