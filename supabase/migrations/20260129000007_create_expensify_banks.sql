-- expensify_banks: banks for cards and transactions (dropdown / reference)
create extension if not exists pgcrypto;

create table if not exists expensify_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text null,
  logo_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expensify_banks_created_at
  on expensify_banks(created_at);

create index if not exists idx_expensify_banks_name
  on expensify_banks(name);

drop trigger if exists trigger_expensify_banks_updated_at on expensify_banks;

create or replace function set_expensify_banks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_expensify_banks_updated_at
before update on expensify_banks
for each row
execute function set_expensify_banks_updated_at();

alter table expensify_banks enable row level security;

drop policy if exists "Allow all operations on expensify_banks" on expensify_banks;
create policy "Allow all operations on expensify_banks"
  on expensify_banks
  for all
  using (true)
  with check (true);
