-- Remove category support: drop FK, column, and categories table

alter table expensify_transactions
  drop constraint if exists expensify_transactions_category_id_fkey;

drop index if exists idx_expensify_transactions_category_id;

alter table expensify_transactions
  drop column if exists category_id;

drop trigger if exists trigger_expensify_categories_updated_at on expensify_categories;
drop function if exists set_expensify_categories_updated_at();

drop table if exists expensify_categories;
