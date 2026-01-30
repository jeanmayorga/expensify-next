import { Database } from "@/types/database";

export type Category =
  Database["public"]["Tables"]["expensify_categories"]["Row"];
export type CategoryInsert =
  Database["public"]["Tables"]["expensify_categories"]["Insert"];
export type CategoryUpdate =
  Database["public"]["Tables"]["expensify_categories"]["Update"];
