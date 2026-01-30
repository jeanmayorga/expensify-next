import { api } from "@/lib/api";
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilters,
} from "@/app/api/transactions/model";
import type { Bank } from "@/app/api/banks/model";
import type { Category } from "@/app/api/categories/model";
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
  category: Category | null;
  card: CardWithBank | null;
  budget: Budget | null;
};

export async function getTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.category_id) params.set("category_id", filters.category_id);
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
