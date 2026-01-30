-- Migrate data from transactions to expensify_transactions
-- 1. Delete existing expensify_transactions
-- 2. Insert from transactions with bank/category mapping

-- Clear expensify_transactions
delete from expensify_transactions;

-- Migrate transactions to expensify_transactions
insert into expensify_transactions (
  amount,
  bank_id,
  category_id,
  description,
  income_message_id,
  is_manual,
  occurred_at,
  type,
  created_at
)

select
  coalesce(t.amount, 0) as amount,
  b.id as bank_id,
  c.id as category_id,
  coalesce(t.description, t.title, 'Sin descripción') as description,
  t.income_message_id,
  (t.income_message_id is null) as is_manual,
  t.occurred_at,
  coalesce(t.type, 'expense') as type,
  t.created_at

from transactions t
left join expensify_banks b on lower(b.name) = lower(t.bank)
left join expensify_categories c on lower(c.name) = lower(t.category);
