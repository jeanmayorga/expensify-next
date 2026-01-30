import { supabase } from "@/app/api/supabase/service";
import {
  Card,
  CardInsert,
  CardUpdate,
  CardWithBank,
} from "@/app/api/cards/model";

export class CardsRepository {
  async getAll(): Promise<CardWithBank[]> {
    const { data, error } = await supabase
      .from("expensify_cards")
      .select("*, bank:expensify_banks(*)")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("CardsRepository->getAll()->error", error.message);
      throw error;
    }

    return (data || []) as CardWithBank[];
  }

  async getById(id: string): Promise<CardWithBank | null> {
    const { data, error } = await supabase
      .from("expensify_cards")
      .select("*, bank:expensify_banks(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("CardsRepository->getById()->error", error.message);
      throw error;
    }

    return data as CardWithBank;
  }

  async create(dto: CardInsert): Promise<Card> {
    const { data, error } = await supabase
      .from("expensify_cards")
      .insert(dto)
      .select("*")
      .single();

    if (error) {
      console.error("CardsRepository->create()->error", error.message);
      throw error;
    }
    return data;
  }

  async update(id: string, dto: CardUpdate): Promise<Card> {
    const { data, error } = await supabase
      .from("expensify_cards")
      .update(dto)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("CardsRepository->update()->error", error.message);
      throw error;
    }

    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("expensify_cards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("CardsRepository->delete()->error", error.message);
      return false;
    }

    return true;
  }
}
