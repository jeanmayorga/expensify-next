-- Add new fields to expensify_cards table
ALTER TABLE expensify_cards
ADD COLUMN card_type text, -- visa, mastercard, amex
ADD COLUMN card_kind text, -- credit, debit
ADD COLUMN cardholder_name text,
ADD COLUMN expiration_date text,
ADD COLUMN outstanding_balance numeric;
