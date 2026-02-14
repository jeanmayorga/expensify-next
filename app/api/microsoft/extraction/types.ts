/**
 * Data extracted from an email, ready to be merged with bank_id and income_message_id
 * to form a TransactionInsert.
 */
export interface ExtractedTransactionData {
  type: "expense" | "income";
  description: string;
  amount: number;
  occurred_at: string; // ISO string
  /** 'card' = pago con tarjeta (card_id puede setearse), 'transfer' = transferencia (card_id null) */
  payment_method?: "card" | "transfer";
  card_last4?: string;
  /** Cuando el email no trae últimos 4 (ej. consumo débito Produbanco), usar la tarjeta de este tipo del banco */
  prefer_card_type?: "debit" | "credit";
  comment?: string | null;
}
