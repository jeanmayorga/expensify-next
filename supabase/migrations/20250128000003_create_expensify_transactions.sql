-- Create expensify_transactions table for manual transactions
CREATE TABLE IF NOT EXISTS expensify_transactions (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'refund')),
  category TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bank TEXT NOT NULL DEFAULT 'Manual',
  income_message_id TEXT DEFAULT NULL,
  is_manual BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_expensify_transactions_occurred_at
  ON expensify_transactions(occurred_at);

CREATE INDEX IF NOT EXISTS idx_expensify_transactions_type
  ON expensify_transactions(type);

CREATE INDEX IF NOT EXISTS idx_expensify_transactions_bank
  ON expensify_transactions(bank);

ALTER TABLE expensify_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on expensify_transactions" ON expensify_transactions;
CREATE POLICY "Allow all operations on expensify_transactions"
  ON expensify_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
