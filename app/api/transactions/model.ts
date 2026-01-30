import { Database } from "@/types/database";

export type Transaction =
  Database["public"]["Tables"]["expensify_transactions"]["Row"];
export type TransactionInsert =
  Database["public"]["Tables"]["expensify_transactions"]["Insert"];
export type TransactionUpdate =
  Database["public"]["Tables"]["expensify_transactions"]["Update"];

export interface TransactionFilters {
  date?: string;
  month?: string; // Format: "YYYY-MM"
  startDate?: string;
  endDate?: string;
  type?: "expense" | "income";
  bank_id?: string;
  budget_id?: string;
}
