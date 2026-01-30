-- Add comment field to expensify_transactions
ALTER TABLE expensify_transactions
ADD COLUMN IF NOT EXISTS comment TEXT;
