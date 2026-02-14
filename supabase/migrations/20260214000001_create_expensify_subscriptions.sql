CREATE TABLE expensify_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  billing_day INT NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly','monthly','yearly')),
  card_id UUID REFERENCES expensify_cards(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES expensify_budgets(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
