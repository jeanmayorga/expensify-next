import { Database } from "@/types/database";

export type BudgetAssignment =
  Database["public"]["Tables"]["expensify_tx_budget_assignments"]["Row"];
export type BudgetAssignmentInsert =
  Database["public"]["Tables"]["expensify_tx_budget_assignments"]["Insert"];
export type BudgetAssignmentUpdate =
  Database["public"]["Tables"]["expensify_tx_budget_assignments"]["Update"];
