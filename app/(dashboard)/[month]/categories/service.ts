import { api } from "@/lib/api";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
} from "@/app/api/categories/model";

export type { Category, CategoryInsert, CategoryUpdate };

export async function getCategories() {
  const { data } = await api.get<{ data: Category[] }>("/categories");
  return data.data;
}

export async function getCategory(id: string) {
  const { data } = await api.get<{ data: Category }>(`/categories/${id}`);
  return data.data;
}

export async function createCategory(payload: CategoryInsert) {
  const { data } = await api.post<{ data: Category }>("/categories", payload);
  return data.data;
}

export async function updateCategory(id: string, payload: CategoryUpdate) {
  const { data } = await api.patch<{ data: Category }>(
    `/categories/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}
