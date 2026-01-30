import { supabase } from "@/app/api/supabase/service";
import { BudgetAssignment } from "@/app/api/assignments/model";

export class BudgetAssignmentsService {
  async getByTransactionIds(
    transactionIds: number[],
  ): Promise<Record<string, string>> {
    if (transactionIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from("expensify_tx_budget_assignments")
      .select("transaction_id,budget_id")
      .in("transaction_id", transactionIds);

    if (error) {
      console.error(
        "BudgetAssignmentsService->getByTransactionIds()->error",
        error.message,
      );
      throw error;
    }

    const assignments: Record<string, string> = {};
    for (const row of data || []) {
      assignments[String(row.transaction_id)] = row.budget_id;
    }

    return assignments;
  }

  async upsert(
    transactionId: number,
    budgetId: string,
  ): Promise<BudgetAssignment> {
    const { data, error } = await supabase
      .from("expensify_tx_budget_assignments")
      .upsert(
        { transaction_id: transactionId, budget_id: budgetId },
        { onConflict: "transaction_id" },
      )
      .select("*")
      .single();

    if (error) {
      console.error("BudgetAssignmentsService->upsert()->error", error.message);
      throw error;
    }

    return data;
  }

  async delete(transactionId: number): Promise<boolean> {
    const { error } = await supabase
      .from("expensify_tx_budget_assignments")
      .delete()
      .eq("transaction_id", transactionId);

    if (error) {
      console.error("BudgetAssignmentsService->delete()->error", error.message);
      return false;
    }

    return true;
  }
}
