-- Add bank_id to expensify_subscriptions (FK to expensify_banks)
ALTER TABLE expensify_subscriptions
  ADD COLUMN IF NOT EXISTS bank_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expensify_subscriptions_bank_id_fkey'
  ) THEN
    ALTER TABLE expensify_subscriptions
      ADD CONSTRAINT expensify_subscriptions_bank_id_fkey
      FOREIGN KEY (bank_id) REFERENCES expensify_banks(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expensify_subscriptions_bank_id
  ON expensify_subscriptions(bank_id);
