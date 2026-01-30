import { Database } from "@/types/database";

export type Bank = Database["public"]["Tables"]["expensify_banks"]["Row"];
export type BankInsert =
  Database["public"]["Tables"]["expensify_banks"]["Insert"];
export type BankUpdate =
  Database["public"]["Tables"]["expensify_banks"]["Update"];
