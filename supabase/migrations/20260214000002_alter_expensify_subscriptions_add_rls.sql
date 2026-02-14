-- Enable Row Level Security
ALTER TABLE expensify_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (matches pattern from other tables)
DROP POLICY IF EXISTS "Allow all operations on expensify_subscriptions" ON expensify_subscriptions;
CREATE POLICY "Allow all operations on expensify_subscriptions"
  ON expensify_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_expensify_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_expensify_subscriptions_updated_at ON expensify_subscriptions;
CREATE TRIGGER trigger_expensify_subscriptions_updated_at
  BEFORE UPDATE ON expensify_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_expensify_subscriptions_updated_at();
