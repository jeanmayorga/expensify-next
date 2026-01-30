-- expensify_categories: user-defined categories for transactions
create extension if not exists pgcrypto;

create table if not exists expensify_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expensify_categories_created_at
  on expensify_categories(created_at);

drop trigger if exists trigger_expensify_categories_updated_at on expensify_categories;

create or replace function set_expensify_categories_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_expensify_categories_updated_at
before update on expensify_categories
for each row
execute function set_expensify_categories_updated_at();

alter table expensify_categories enable row level security;

drop policy if exists "Allow all operations on expensify_categories" on expensify_categories;
create policy "Allow all operations on expensify_categories"
  on expensify_categories
  for all
  using (true)
  with check (true);
