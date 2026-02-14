-- Add payment due day to expensify_cards
-- payment_due_day: day of month when payment is due (same month as cut_end_day)
-- Example: cycle ends Feb 13, payment_due_day=28 -> pay by Feb 28
ALTER TABLE expensify_cards
  ADD COLUMN IF NOT EXISTS payment_due_day smallint CHECK (payment_due_day >= 1 AND payment_due_day <= 31);

COMMENT ON COLUMN expensify_cards.payment_due_day IS 'Day of month when payment is due (1-31), same month as cycle end';
