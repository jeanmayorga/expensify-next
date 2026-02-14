import { Database } from "@/types/database";

export type Transaction =
  Database["public"]["Tables"]["expensify_transactions"]["Row"];
export type TransactionInsert =
  Database["public"]["Tables"]["expensify_transactions"]["Insert"];
export type TransactionUpdate =
  Database["public"]["Tables"]["expensify_transactions"]["Update"];

export interface TransactionFilters {
  /** Formato: YYYY-MM (ej: 2025-01) - usado cuando no hay date_from/date_to */
  date?: string;
  /** Formato: YYYY-MM-DD - inicio del rango (inclusivo) */
  date_from?: string;
  /** Formato: YYYY-MM-DD - fin del rango (inclusivo) */
  date_to?: string;
  card_id?: string;
  bank_id?: string;
  budget_id?: string;
  /** 'card' = con tarjeta, 'transfer' = transferencia (sin tarjeta) */
  payment_method?: "card" | "transfer";
  /** Timezone IANA (ej: America/Guayaquil, America/New_York). Default: America/Guayaquil */
  timezone?: string;
  /** Buscar en description y comment (ignora date cuando se usa) */
  search?: string;
}
