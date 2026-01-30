import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptions,
  createSubscription,
  deleteSubscription,
  renewSubscription,
} from "./service";

export function useSubscriptions() {
  return useQuery({
    queryKey: ["microsoft-subscriptions"],
    queryFn: getSubscriptions,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["microsoft-subscriptions"] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["microsoft-subscriptions"] });
    },
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renewSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["microsoft-subscriptions"] });
    },
  });
}
