import { supabase } from "@/app/api/supabase/service";
import {
  SubscriptionInsert,
  SubscriptionUpdate,
  SubscriptionWithRelations,
} from "@/app/api/subscriptions/model";

export class SubscriptionsRepository {
  async getAll(): Promise<SubscriptionWithRelations[]> {
    const { data, error } = await supabase
      .from("expensify_subscriptions")
      .select("*, card:expensify_cards(*, bank:expensify_banks(*)), budget:expensify_budgets(*)")
      .order("billing_day", { ascending: true });

    if (error) {
      console.error("SubscriptionsRepository->getAll()->error", error.message);
      throw error;
    }

    return (data as SubscriptionWithRelations[]) || [];
  }

  async getById(id: string): Promise<SubscriptionWithRelations | null> {
    const { data, error } = await supabase
      .from("expensify_subscriptions")
      .select("*, card:expensify_cards(*, bank:expensify_banks(*)), budget:expensify_budgets(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error(
        "SubscriptionsRepository->getById()->error",
        error.message,
      );
      throw error;
    }

    return data as SubscriptionWithRelations;
  }

  async create(
    dto: SubscriptionInsert,
  ): Promise<SubscriptionWithRelations> {
    const { data, error } = await supabase
      .from("expensify_subscriptions")
      .insert(dto)
      .select("*, card:expensify_cards(*, bank:expensify_banks(*)), budget:expensify_budgets(*)")
      .single();

    if (error) {
      console.error(
        "SubscriptionsRepository->create()->error",
        error.message,
      );
      throw error;
    }

    return data as SubscriptionWithRelations;
  }

  async update(
    id: string,
    dto: SubscriptionUpdate,
  ): Promise<SubscriptionWithRelations> {
    const { data, error } = await supabase
      .from("expensify_subscriptions")
      .update(dto)
      .eq("id", id)
      .select("*, card:expensify_cards(*, bank:expensify_banks(*)), budget:expensify_budgets(*)")
      .single();

    if (error) {
      console.error(
        "SubscriptionsRepository->update()->error",
        error.message,
      );
      throw error;
    }

    return data as SubscriptionWithRelations;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("expensify_subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "SubscriptionsRepository->delete()->error",
        error.message,
      );
      return false;
    }

    return true;
  }
}
