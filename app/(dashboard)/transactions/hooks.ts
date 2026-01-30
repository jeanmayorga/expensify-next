import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  getTransactions,
  updateTransaction,
  deleteTransaction,
  type TransactionFilters,
  type TransactionUpdate,
} from "./service";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) => ["transactions", filters] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => getTransactions(filters),
  });
}

export function useTransactionsForMonth(date: Date) {
  const dateStr = format(date, "yyyy-MM");
  return useTransactions({ date: dateStr });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionUpdate }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
