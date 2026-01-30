-- expensify_cards: user-defined cards/accounts for transactions
create extension if not exists pgcrypto;

create table if not exists expensify_cards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  bank text not null,
  last4 text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expensify_cards_created_at
  on expensify_cards(created_at);

create index if not exists idx_expensify_cards_bank
  on expensify_cards(bank);

drop trigger if exists trigger_expensify_cards_updated_at on expensify_cards;

create or replace function set_expensify_cards_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_expensify_cards_updated_at
before update on expensify_cards
for each row
execute function set_expensify_cards_updated_at();

alter table expensify_cards enable row level security;

drop policy if exists "Allow all operations on expensify_cards" on expensify_cards;
create policy "Allow all operations on expensify_cards"
  on expensify_cards
  for all
  using (true)
  with check (true);
