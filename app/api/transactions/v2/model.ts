import { Database } from "@/types/database";

export type ExpensifyTransaction =
  Database["public"]["Tables"]["expensify_transactions"]["Row"];
export type ExpensifyTransactionInsert =
  Database["public"]["Tables"]["expensify_transactions"]["Insert"];
export type ExpensifyTransactionUpdate =
  Database["public"]["Tables"]["expensify_transactions"]["Update"];

export interface TransactionFilters {
  date?: string;
  month?: string; // Format: "YYYY-MM"
  startDate?: string;
  endDate?: string;
  type?: "expense" | "income";
  bank?: string;
}
