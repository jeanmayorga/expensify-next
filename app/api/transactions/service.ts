import { supabase } from "@/app/api/supabase/service";
import {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilters,
} from "@/app/api/transactions/model";
import { startOfMonth, endOfMonth, endOfDay, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const DEFAULT_TIMEZONE = "America/Guayaquil";

export class TransactionsService {
  async getAll(filters: TransactionFilters = {}): Promise<Transaction[]> {
    console.log("TransactionsService->getAll()->filters", filters);
    let query = supabase
      .from("expensify_transactions")
      .select(
        "*, bank:bank_id(*), category:category_id(*), card:card_id(*), budget:budget_id(*)",
      );
    const timezone = filters.timezone || DEFAULT_TIMEZONE;

    if (filters.date) {
      const parsed = parse(filters.date, "yyyy-MM", new Date());
      const start = startOfMonth(parsed);
      const end = endOfDay(endOfMonth(parsed));

      const startUTC = fromZonedTime(start, timezone);
      const endUTC = fromZonedTime(end, timezone);

      query = query
        .gte("occurred_at", startUTC.toISOString())
        .lte("occurred_at", endUTC.toISOString());
    }

    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.card_id) {
      query = query.eq("card_id", filters.card_id);
    }

    if (filters.bank_id) {
      query = query.eq("bank_id", filters.bank_id);
    }

    if (filters.budget_id) {
      query = query.eq("budget_id", filters.budget_id);
    }

    query = query.order("occurred_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("TransactionsService->getAll()->error", error.message);
      throw error;
    }

    return data || [];
  }

  async getById(id: number): Promise<Transaction | null> {
    console.log("TransactionsService->getById()->id", id);
    const { data, error } = await supabase
      .from("expensify_transactions")
      .select(
        "*, bank:bank_id(*), category:category_id(*), card:card_id(*), budget:budget_id(*)",
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("TransactionsService->getById()->error", error.message);
      throw error;
    }

    return data;
  }

  async getByIncomeMessageId(messageId: string): Promise<Transaction | null> {
    console.log(
      "TransactionsService->getByIncomeMessageId()->messageId",
      messageId,
    );
    const { data, error } = await supabase
      .from("expensify_transactions")
      .select("*")
      .eq("income_message_id", messageId)
      .maybeSingle();

    if (error) {
      console.error(
        "TransactionsService->getByIncomeMessageId()->error",
        error.message,
      );
      throw error;
    }

    return data ?? null;
  }

  async create(dto: TransactionInsert): Promise<Transaction> {
    console.log("TransactionsService->create()->dto", dto);
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

    return data;
  }

  async update(id: number, dto: TransactionUpdate): Promise<Transaction> {
    console.log("TransactionsService->update()->id", id);
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

    return data;
  }

  async delete(id: number): Promise<boolean> {
    console.log("TransactionsService->delete()->id", id);
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
}
