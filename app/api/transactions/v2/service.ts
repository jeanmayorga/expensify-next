import { supabase } from "@/app/api/supabase/service";
import {
  ExpensifyTransaction,
  ExpensifyTransactionInsert,
  ExpensifyTransactionUpdate,
  TransactionFilters,
} from "@/app/api/transactions/v2/model";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Guayaquil";

function normalizeTransaction(tx: ExpensifyTransaction): ExpensifyTransaction {
  return {
    ...tx,
    amount: Number(tx.amount),
    bank: tx.bank || "Manual",
  };
}

export class ExpensifyTransactionsService {
  async getAll(
    filters: TransactionFilters = {},
  ): Promise<ExpensifyTransaction[]> {
    let query = supabase.from("expensify_transactions").select("*");

    if (filters.month) {
      const parts = filters.month.split("-").map(Number);
      const year = parts[0]!;
      const month = parts[1]!;

      const startOfMonthLocal = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endOfMonthLocal = new Date(year, month, 0, 23, 59, 59, 999);

      const startOfMonthUTC = fromZonedTime(startOfMonthLocal, TIMEZONE);
      const endOfMonthUTC = fromZonedTime(endOfMonthLocal, TIMEZONE);

      query = query
        .gte("occurred_at", startOfMonthUTC.toISOString())
        .lte("occurred_at", endOfMonthUTC.toISOString());
    } else if (filters.date) {
      const parts = filters.date.split("-").map(Number);
      const year = parts[0]!;
      const month = parts[1]!;
      const day = parts[2]!;

      const startOfDayLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDayLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

      const startOfDayUTC = fromZonedTime(startOfDayLocal, TIMEZONE);
      const endOfDayUTC = fromZonedTime(endOfDayLocal, TIMEZONE);

      query = query
        .gte("occurred_at", startOfDayUTC.toISOString())
        .lte("occurred_at", endOfDayUTC.toISOString());
    }

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      query = query
        .gte("occurred_at", start.toISOString())
        .lte("occurred_at", end.toISOString());
    }

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.bank) {
      query = query.eq("bank", filters.bank);
    }

    query = query.order("occurred_at", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error(
        "ExpensifyTransactionsService->getAll()->error",
        error.message,
      );
      throw error;
    }

    return (data || []).map(normalizeTransaction);
  }

  async getById(id: number): Promise<ExpensifyTransaction | null> {
    const { data, error } = await supabase
      .from("expensify_transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error(
        "ExpensifyTransactionsService->getById()->error",
        error.message,
      );
      throw error;
    }

    return normalizeTransaction(data);
  }

  async create(dto: ExpensifyTransactionInsert): Promise<ExpensifyTransaction> {
    const transactionData = {
      type: dto.type,
      description: dto.description,
      amount: dto.amount,
      occurred_at: dto.occurred_at || new Date().toISOString(),
      bank: dto.bank || "Manual",
      category: dto.category || null,
      category_id: dto.category_id ?? null,
      card_id: dto.card_id ?? null,
      income_message_id: null,
      is_manual: true,
    };

    const { data, error } = await supabase
      .from("expensify_transactions")
      .insert(transactionData)
      .select("*")
      .single();

    if (error) {
      console.error(
        "ExpensifyTransactionsService->create()->error",
        error.message,
      );
      throw error;
    }

    return normalizeTransaction(data);
  }

  async update(
    id: number,
    dto: ExpensifyTransactionUpdate,
  ): Promise<ExpensifyTransaction> {
    const { data, error } = await supabase
      .from("expensify_transactions")
      .update(dto)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "ExpensifyTransactionsService->update()->error",
        error.message,
      );
      throw error;
    }

    return normalizeTransaction(data);
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from("expensify_transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "ExpensifyTransactionsService->delete()->error",
        error.message,
      );
      return false;
    }

    return true;
  }
}
