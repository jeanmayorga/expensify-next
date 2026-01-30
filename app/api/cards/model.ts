import { Database } from "@/types/database";
import type { Bank } from "@/app/api/banks/model";

export type Card = Database["public"]["Tables"]["expensify_cards"]["Row"];
export type CardInsert =
  Database["public"]["Tables"]["expensify_cards"]["Insert"];
export type CardUpdate =
  Database["public"]["Tables"]["expensify_cards"]["Update"];

export type CardWithBank = Card & {
  bank: Bank | null;
};
