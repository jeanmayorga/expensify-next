import { api } from "@/lib/api";
import type { Bank, BankInsert, BankUpdate } from "@/app/api/banks/model";

export type { Bank, BankInsert, BankUpdate };

export async function getBanks() {
  const { data } = await api.get<{ data: Bank[] }>("/banks");
  return data.data;
}

export async function getBank(id: string) {
  const { data } = await api.get<{ data: Bank }>(`/banks/${id}`);
  return data.data;
}

export async function createBank(payload: BankInsert) {
  const { data } = await api.post<{ data: Bank }>("/banks", payload);
  return data.data;
}

export async function updateBank(id: string, payload: BankUpdate) {
  const { data } = await api.patch<{ data: Bank }>(`/banks/${id}`, payload);
  return data.data;
}

export async function deleteBank(id: string) {
  await api.delete(`/banks/${id}`);
}
