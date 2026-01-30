-- expensify_transactions: remove category and bank (text), add bank_id and budget_id, unique income_message_id

alter table expensify_transactions
  add column if not exists bank_id uuid null,
  add column if not exists budget_id uuid null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expensify_transactions_bank_id_fkey') then
    alter table expensify_transactions
      add constraint expensify_transactions_bank_id_fkey
      foreign key (bank_id) references expensify_banks(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'expensify_transactions_budget_id_fkey') then
    alter table expensify_transactions
      add constraint expensify_transactions_budget_id_fkey
      foreign key (budget_id) references expensify_budgets(id) on delete set null;
  end if;
end $$;

create unique index if not exists idx_expensify_transactions_income_message_id_unique
  on expensify_transactions(income_message_id)
  where income_message_id is not null;

alter table expensify_transactions
  drop column if exists category,
  drop column if exists bank;

create index if not exists idx_expensify_transactions_bank_id on expensify_transactions(bank_id);
create index if not exists idx_expensify_transactions_budget_id on expensify_transactions(budget_id);
