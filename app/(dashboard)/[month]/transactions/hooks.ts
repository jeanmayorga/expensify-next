import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  getTransactions,
  updateTransaction,
  deleteTransaction,
  createTransaction,
  createTransactions,
  extractTransactionFromImage,
  extractTransactionsFromImage,
  type TransactionFilters,
  type TransactionUpdate,
  type TransactionInsert,
  type ImageExtractionHints,
} from "./service";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) => ["transactions", filters] as const,
};

export function useTransactions(
  filters: TransactionFilters = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => getTransactions(filters),
    enabled: options?.enabled ?? true,
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

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionInsert) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useExtractFromImage() {
  return useMutation({
    mutationFn: ({
      image,
      mimeType,
      hints,
    }: {
      image: string;
      mimeType: string;
      hints?: ImageExtractionHints;
    }) => extractTransactionFromImage(image, mimeType, hints),
  });
}

export function useExtractBulkFromImage() {
  return useMutation({
    mutationFn: extractTransactionsFromImage,
  });
}

export function useCreateTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionInsert[]) => createTransactions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
