-- Add icon column to expensify_budgets
ALTER TABLE expensify_budgets
ADD COLUMN IF NOT EXISTS icon TEXT NULL;

COMMENT ON COLUMN expensify_budgets.icon IS 'Lucide icon name for the budget (e.g. Wallet, ShoppingCart)';
