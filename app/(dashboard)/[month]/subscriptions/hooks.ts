import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  type SubscriptionInsert,
  type SubscriptionUpdate,
} from "./service";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  detail: (id: string) => ["subscriptions", id] as const,
};

export function useSubscriptions() {
  return useQuery({
    queryKey: subscriptionKeys.all,
    queryFn: getSubscriptions,
  });
}

export function useSubscription(id: string | null) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id ?? ""),
    queryFn: () => getSubscription(id!),
    enabled: !!id,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscriptionInsert) => createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubscriptionUpdate }) =>
      updateSubscription(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}
