-- Add payment_method to distinguish card vs transfer payments
-- 'card' = paid with card (card_id can be set)
-- 'transfer' = transfer (card_id should be null)
ALTER TABLE expensify_transactions
ADD COLUMN IF NOT EXISTS payment_method text;
