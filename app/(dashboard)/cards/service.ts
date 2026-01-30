import { api } from "@/lib/api";
import type {
  Card,
  CardInsert,
  CardUpdate,
  CardWithBank,
} from "@/app/api/cards/model";

export type { Card, CardInsert, CardUpdate, CardWithBank };

export async function getCards() {
  const { data } = await api.get<{ data: CardWithBank[] }>("/cards");
  return data.data;
}

export async function createCard(payload: CardInsert) {
  const { data } = await api.post<{ data: Card }>("/cards", payload);
  return data.data;
}

export async function updateCard(id: string, payload: CardUpdate) {
  const { data } = await api.patch<{ data: Card }>(`/cards/${id}`, payload);
  return data.data;
}

export async function deleteCard(id: string) {
  await api.delete(`/cards/${id}`);
}
