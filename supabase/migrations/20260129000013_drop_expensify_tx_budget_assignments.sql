-- Remove expensify_tx_budget_assignments; budget is now on expensify_transactions.budget_id
drop table if exists expensify_tx_budget_assignments;
