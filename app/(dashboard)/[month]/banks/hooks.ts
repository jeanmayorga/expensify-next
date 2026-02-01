import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBanks,
  getBank,
  createBank,
  updateBank,
  deleteBank,
  type BankInsert,
  type BankUpdate,
} from "./service";

export const bankKeys = {
  all: ["banks"] as const,
  detail: (id: string) => ["banks", id] as const,
};

export function useBanks() {
  return useQuery({
    queryKey: bankKeys.all,
    queryFn: getBanks,
  });
}

export function useBank(id: string | null) {
  return useQuery({
    queryKey: bankKeys.detail(id ?? ""),
    queryFn: () => getBank(id!),
    enabled: !!id,
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BankInsert) => createBank(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BankUpdate }) =>
      updateBank(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}
