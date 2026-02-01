import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  type CardInsert,
  type CardUpdate,
} from "./service";

export const cardKeys = {
  all: ["cards"] as const,
};

export function useCards() {
  return useQuery({
    queryKey: cardKeys.all,
    queryFn: getCards,
  });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: [...cardKeys.all, id],
    queryFn: () => getCard(id),
    enabled: !!id,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CardInsert) => createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CardUpdate }) =>
      updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
    },
  });
}
