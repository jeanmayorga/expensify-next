import { Database } from "@/types/database";

export type Budget = Database["public"]["Tables"]["expensify_budgets"]["Row"];
export type BudgetInsert =
  Database["public"]["Tables"]["expensify_budgets"]["Insert"];
export type BudgetUpdate =
  Database["public"]["Tables"]["expensify_budgets"]["Update"];
