-- Add billing cycle dates to expensify_cards
-- cut_start_day: day of month when billing cycle starts (e.g. 16 = 16th)
-- cut_end_day: day of next month when billing cycle ends (e.g. 13 = 13th of next month)
-- Example: cut_start_day=16, cut_end_day=13 -> cycle runs from 16th to 13th of next month
ALTER TABLE expensify_cards
  ADD COLUMN IF NOT EXISTS cut_start_day smallint CHECK (cut_start_day >= 1 AND cut_start_day <= 31),
  ADD COLUMN IF NOT EXISTS cut_end_day smallint CHECK (cut_end_day >= 1 AND cut_end_day <= 31);

COMMENT ON COLUMN expensify_cards.cut_start_day IS 'Day of month when billing cycle starts (1-31)';
COMMENT ON COLUMN expensify_cards.cut_end_day IS 'Day of next month when billing cycle ends (1-31)';
