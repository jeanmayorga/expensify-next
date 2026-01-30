-- Add category_id and card_id to expensify_transactions and set up FKs
create extension if not exists pgcrypto;

alter table expensify_transactions
  add column if not exists category_id uuid null,
  add column if not exists card_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expensify_transactions_category_id_fkey'
  ) then
    alter table expensify_transactions
      add constraint expensify_transactions_category_id_fkey
      foreign key (category_id)
      references expensify_categories(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'expensify_transactions_card_id_fkey'
  ) then
    alter table expensify_transactions
      add constraint expensify_transactions_card_id_fkey
      foreign key (card_id)
      references expensify_cards(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_expensify_transactions_category_id
  on expensify_transactions(category_id);

create index if not exists idx_expensify_transactions_card_id
  on expensify_transactions(card_id);
