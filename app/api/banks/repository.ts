import { supabase } from "@/app/api/supabase/service";
import { Bank, BankInsert, BankUpdate } from "@/app/api/banks/model";

export class BanksRepository {
  async getAll(): Promise<Bank[]> {
    console.log("BanksRepository->getAll()");
    const { data, error } = await supabase
      .from("expensify_banks")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("BanksRepository->getAll()->error", error.message);
      throw error;
    }

    return data || [];
  }

  async getById(id: string): Promise<Bank | null> {
    console.log("BanksRepository->getById()", id);
    const { data, error } = await supabase
      .from("expensify_banks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("BanksRepository->getById()->error", error.message);
      throw error;
    }

    return data;
  }

  async create(dto: BankInsert): Promise<Bank> {
    console.log("BanksRepository->create()", dto);
    const { data, error } = await supabase
      .from("expensify_banks")
      .insert(dto)
      .select("*")
      .single();

    if (error) {
      console.error("BanksRepository->create()->error", error.message);
      throw error;
    }

    return data;
  }

  async update(id: string, dto: BankUpdate): Promise<Bank> {
    console.log("BanksRepository->update()", id, dto);
    const { data, error } = await supabase
      .from("expensify_banks")
      .update(dto)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("BanksRepository->update()->error", error.message);
      throw error;
    }

    return data;
  }

  async delete(id: string): Promise<boolean> {
    console.log("BanksRepository->delete()", id);
    const { error } = await supabase
      .from("expensify_banks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("BanksRepository->delete()->error", error.message);
      return false;
    }

    return true;
  }
}
