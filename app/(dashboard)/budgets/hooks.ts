import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  type BudgetInsert,
  type BudgetUpdate,
} from "./service";

export const budgetKeys = {
  all: ["budgets"] as const,
};

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.all,
    queryFn: getBudgets,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetInsert) => createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdate }) =>
      updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
