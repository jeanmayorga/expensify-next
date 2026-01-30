-- Create expensify_tx_budget_assignments table
CREATE TABLE IF NOT EXISTS expensify_tx_budget_assignments (
  transaction_id BIGINT NOT NULL PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES expensify_budgets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_expensify_tx_budget_assignments_budget_id
  ON expensify_tx_budget_assignments(budget_id);

CREATE INDEX IF NOT EXISTS idx_expensify_tx_budget_assignments_transaction_id
  ON expensify_tx_budget_assignments(transaction_id);

ALTER TABLE expensify_tx_budget_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on expensify_tx_budget_assignments" ON expensify_tx_budget_assignments;
CREATE POLICY "Allow all operations on expensify_tx_budget_assignments"
  ON expensify_tx_budget_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);
