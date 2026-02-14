import { api } from "@/lib/api";
import type {
  SubscriptionInsert,
  SubscriptionUpdate,
  SubscriptionWithRelations,
} from "@/app/api/subscriptions/model";

export type { SubscriptionInsert, SubscriptionUpdate, SubscriptionWithRelations };

export async function getSubscriptions() {
  const { data } = await api.get<{ data: SubscriptionWithRelations[] }>("/subscriptions");
  return data.data;
}

export async function getSubscription(id: string) {
  const { data } = await api.get<{ data: SubscriptionWithRelations }>(`/subscriptions/${id}`);
  return data.data;
}

export async function createSubscription(payload: SubscriptionInsert) {
  const { data } = await api.post<{ data: SubscriptionWithRelations }>("/subscriptions", payload);
  return data.data;
}

export async function updateSubscription(id: string, payload: SubscriptionUpdate) {
  const { data } = await api.patch<{ data: SubscriptionWithRelations }>(`/subscriptions/${id}`, payload);
  return data.data;
}

export async function deleteSubscription(id: string) {
  await api.delete(`/subscriptions/${id}`);
}
