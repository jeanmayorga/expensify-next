import { supabase } from "@/app/api/supabase/service";
import { Budget, BudgetInsert, BudgetUpdate } from "@/app/api/budgets/model";

export class BudgetsRepository {
  async getAll(): Promise<Budget[]> {
    console.log("BudgetsRepository->getAll()");
    const { data, error } = await supabase
      .from("expensify_budgets")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("BudgetsRepository->getAll()->error", error.message);
      throw error;
    }

    return data || [];
  }

  async getById(id: string): Promise<Budget | null> {
    console.log("BudgetsRepository->getById()", id);
    const { data, error } = await supabase
      .from("expensify_budgets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("BudgetsRepository->getById()->error", error.message);
      throw error;
    }

    return data;
  }

  async create(dto: BudgetInsert): Promise<Budget> {
    console.log("BudgetsRepository->create()", dto);
    const { data, error } = await supabase
      .from("expensify_budgets")
      .insert(dto)
      .select("*")
      .single();

    if (error) {
      console.error("BudgetsRepository->create()->error", error.message);
      throw error;
    }

    return data;
  }

  async update(id: string, dto: BudgetUpdate): Promise<Budget> {
    console.log("BudgetsRepository->update()", id, dto);
    const { data, error } = await supabase
      .from("expensify_budgets")
      .update(dto)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("BudgetsRepository->update()->error", error.message);
      throw error;
    }

    return data;
  }

  async delete(id: string): Promise<boolean> {
    console.log("BudgetsRepository->delete()", id);
    const { error } = await supabase
      .from("expensify_budgets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("BudgetsRepository->delete()->error", error.message);
      return false;
    }

    return true;
  }
}
