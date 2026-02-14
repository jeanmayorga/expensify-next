import { api } from "@/lib/api";
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilters,
} from "@/app/api/transactions/model";
import type { Bank } from "@/app/api/banks/model";
import type { CardWithBank } from "@/app/api/cards/model";
import type { Budget } from "@/app/api/budgets/model";

export type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilters,
};

export type TransactionWithRelations = Transaction & {
  bank: Bank | null;
  card: CardWithBank | null;
  budget: Budget | null;
};

export async function getTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.search) params.set("search", filters.search);
  if (filters.card_id) params.set("card_id", filters.card_id);
  if (filters.bank_id) params.set("bank_id", filters.bank_id);
  if (filters.budget_id) params.set("budget_id", filters.budget_id);
  if (filters.timezone) params.set("timezone", filters.timezone);

  const query = params.toString();
  const { data } = await api.get<{ data: TransactionWithRelations[] }>(
    `/transactions${query ? `?${query}` : ""}`,
  );
  return data.data;
}

export async function updateTransaction(
  id: number,
  payload: TransactionUpdate,
) {
  const { data } = await api.patch<{ data: Transaction }>(
    `/transactions/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteTransaction(id: number) {
  await api.delete(`/transactions/${id}`);
}

export async function createTransaction(payload: TransactionInsert) {
  const { data } = await api.post<{ data: Transaction }>(
    `/transactions`,
    payload,
  );
  return data.data;
}

export interface ParsedTransaction {
  type: "income" | "expense";
  description: string;
  amount: number;
  occurred_at: string;
  bank_id: string;
  card_id: string | null;
}

export interface ImageExtractionHints {
  userContext?: string;
  preselectedBankId?: string | null;
  preselectedCardId?: string | null;
  preselectedBudgetId?: string | null;
}

export async function extractTransactionFromImage(
  imageBase64: string,
  mimeType: string,
  hints?: ImageExtractionHints,
): Promise<ParsedTransaction> {
  const { data } = await api.post<{ data: ParsedTransaction }>(
    `/transactions/from-image`,
    { image: imageBase64, mimeType, hints },
  );
  return data.data;
}

export async function extractTransactionsFromImage(
  imageBase64: string,
  mimeType: string,
  hints?: ImageExtractionHints,
): Promise<ParsedTransaction[]> {
  const { data } = await api.post<{ data: ParsedTransaction[] }>(
    `/transactions/from-image-bulk`,
    { image: imageBase64, mimeType, hints },
  );
  return data.data;
}

export async function createTransactions(
  payloads: TransactionInsert[],
): Promise<Transaction[]> {
  const results = await Promise.all(
    payloads.map((payload) => createTransaction(payload)),
  );
  return results;
}
