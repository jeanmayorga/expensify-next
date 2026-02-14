import type { TransactionInsert } from "@/app/api/transactions/model";

export interface ExtractedItem {
  tempId: string;
  data: TransactionInsert;
  messageId?: string;
}
