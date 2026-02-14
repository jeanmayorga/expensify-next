import { Database } from "@/types/database";

export type Subscription =
  Database["public"]["Tables"]["expensify_subscriptions"]["Row"];
export type SubscriptionInsert =
  Database["public"]["Tables"]["expensify_subscriptions"]["Insert"];
export type SubscriptionUpdate =
  Database["public"]["Tables"]["expensify_subscriptions"]["Update"];

export type SubscriptionWithRelations = Subscription & {
  card:
    | (Database["public"]["Tables"]["expensify_cards"]["Row"] & {
        bank: Database["public"]["Tables"]["expensify_banks"]["Row"] | null;
      })
    | null;
  budget: Database["public"]["Tables"]["expensify_budgets"]["Row"] | null;
  bank: Database["public"]["Tables"]["expensify_banks"]["Row"] | null;
};
