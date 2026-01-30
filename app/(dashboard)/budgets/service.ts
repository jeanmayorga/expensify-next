import { api } from "@/lib/api";
import type {
  Budget,
  BudgetInsert,
  BudgetUpdate,
} from "@/app/api/budgets/model";

export type { Budget, BudgetInsert, BudgetUpdate };

export async function getBudgets() {
  const { data } = await api.get<{ data: Budget[] }>("/budgets");
  return data.data;
}

export async function createBudget(payload: BudgetInsert) {
  const { data } = await api.post<{ data: Budget }>("/budgets", payload);
  return data.data;
}

export async function updateBudget(id: string, payload: BudgetUpdate) {
  const { data } = await api.patch<{ data: Budget }>(`/budgets/${id}`, payload);
  return data.data;
}

export async function deleteBudget(id: string) {
  await api.delete(`/budgets/${id}`);
}
