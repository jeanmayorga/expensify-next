import { supabase } from "@/app/api/supabase/service";
import {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilters,
} from "@/app/api/transactions/model";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { eachDayOfInterval, format } from "date-fns";

const TIMEZONE = "America/Guayaquil";

function normalizeTransaction(tx: Transaction): Transaction {
  return {
    ...tx,
    amount: Number(tx.amount),
  };
}

export class TransactionsService {
  async getAll(filters: TransactionFilters = {}): Promise<Transaction[]> {
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

    if (filters.bank_id) {
      query = query.eq("bank_id", filters.bank_id);
    }

    if (filters.budget_id) {
      query = query.eq("budget_id", filters.budget_id);
    }

    query = query.order("occurred_at", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("TransactionsService->getAll()->error", error.message);
      throw error;
    }

    return (data || []).map(normalizeTransaction);
  }

  async getById(id: number): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from("expensify_transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("TransactionsService->getById()->error", error.message);
      throw error;
    }

    return normalizeTransaction(data);
  }

  async getByMessageId(messageId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from("expensify_transactions")
      .select("*")
      .eq("income_message_id", messageId)
      .maybeSingle();

    if (error) {
      console.error(
        "TransactionsService->getByMessageId()->error",
        error.message,
      );
      throw error;
    }

    return data ? normalizeTransaction(data) : null;
  }

  async create(dto: TransactionInsert): Promise<Transaction> {
    const isFromEmail = Boolean(dto.income_message_id);
    const transactionData = {
      type: dto.type,
      description: dto.description,
      amount: dto.amount,
      occurred_at: dto.occurred_at || new Date().toISOString(),
      bank_id: dto.bank_id ?? null,
      budget_id: dto.budget_id ?? null,
      category_id: dto.category_id ?? null,
      card_id: dto.card_id ?? null,
      income_message_id: dto.income_message_id ?? null,
      is_manual: !isFromEmail,
    };

    const { data, error } = await supabase
      .from("expensify_transactions")
      .insert(transactionData)
      .select("*")
      .single();

    if (error) {
      console.error("TransactionsService->create()->error", error.message);
      throw error;
    }

    return normalizeTransaction(data);
  }

  async update(id: number, dto: TransactionUpdate): Promise<Transaction> {
    const { data, error } = await supabase
      .from("expensify_transactions")
      .update(dto)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("TransactionsService->update()->error", error.message);
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
      console.error("TransactionsService->delete()->error", error.message);
      return false;
    }

    return true;
  }

  async getSummaryBetweenDates(options: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    data: Record<string, number>;
    totalExpenses: number;
    totalIncomes: number;
    totalAmount: number;
  }> {
    const { data: rows, error } = await supabase
      .from("expensify_transactions")
      .select("*")
      .gte("occurred_at", options.startDate.toISOString())
      .lte("occurred_at", options.endDate.toISOString());

    if (error) {
      console.error(
        "TransactionsService->getSummaryBetweenDates()->error",
        error.message,
      );
      throw error;
    }

    const transactions = rows || [];
    const days: Record<string, number> = {};
    let totalExpenses = 0;
    let totalIncomes = 0;
    let totalAmount = 0;

    eachDayOfInterval({
      start: toZonedTime(options.startDate, TIMEZONE),
      end: toZonedTime(options.endDate, TIMEZONE),
    }).forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      days[key] = 0;
    });

    for (const tx of transactions) {
      const currentDay = format(
        toZonedTime(tx.occurred_at, TIMEZONE),
        "yyyy-MM-dd",
      );
      const amount = Number(tx.amount) || 0;
      days[currentDay] = (days[currentDay] ?? 0) + amount;

      if (tx.type === "expense") {
        totalExpenses += amount;
        totalAmount -= amount;
      }
      if (tx.type === "income") {
        totalIncomes += amount;
        totalAmount += amount;
      }
    }

    return {
      data: days,
      totalExpenses,
      totalIncomes,
      totalAmount,
    };
  }
}
