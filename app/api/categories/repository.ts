import { supabase } from "@/app/api/supabase/service";
import {
  Category,
  CategoryInsert,
  CategoryUpdate,
} from "@/app/api/categories/model";

export class CategoriesRepository {
  async getAll(): Promise<Category[]> {
    console.log("CategoriesRepository->getAll()");
    const { data, error } = await supabase
      .from("expensify_categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("CategoriesRepository->getAll()->error", error.message);
      throw error;
    }

    return data || [];
  }

  async getById(id: string): Promise<Category | null> {
    console.log("CategoriesRepository->getById()", id);
    const { data, error } = await supabase
      .from("expensify_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("CategoriesRepository->getById()->error", error.message);
      throw error;
    }

    return data;
  }

  async create(dto: CategoryInsert): Promise<Category> {
    console.log("CategoriesRepository->create()", dto);
    const { data, error } = await supabase
      .from("expensify_categories")
      .insert(dto)
      .select("*")
      .single();

    if (error) {
      console.error("CategoriesRepository->create()->error", error.message);
      throw error;
    }

    return data;
  }

  async update(id: string, dto: CategoryUpdate): Promise<Category> {
    console.log("CategoriesRepository->update()", id, dto);
    const { data, error } = await supabase
      .from("expensify_categories")
      .update(dto)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("CategoriesRepository->update()->error", error.message);
      throw error;
    }

    return data;
  }

  async delete(id: string): Promise<boolean> {
    console.log("CategoriesRepository->delete()", id);
    const { error } = await supabase
      .from("expensify_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("CategoriesRepository->delete()->error", error.message);
      return false;
    }

    return true;
  }
}
