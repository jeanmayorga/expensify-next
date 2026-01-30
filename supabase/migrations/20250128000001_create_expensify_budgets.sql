-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create expensify_budgets table
CREATE TABLE IF NOT EXISTS expensify_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_expensify_budgets_created_at ON expensify_budgets(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expensify_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_expensify_budgets_updated_at ON expensify_budgets;
CREATE TRIGGER trigger_expensify_budgets_updated_at
  BEFORE UPDATE ON expensify_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_expensify_budgets_updated_at();

-- Enable Row Level Security
ALTER TABLE expensify_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on expensify_budgets" ON expensify_budgets;
CREATE POLICY "Allow all operations on expensify_budgets"
  ON expensify_budgets
  FOR ALL
  USING (true)
  WITH CHECK (true);
