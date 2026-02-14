import { NextRequest, NextResponse } from "next/server";
import { TransactionsService } from "./service";
import { TransactionFilters, TransactionInsert } from "./model";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: TransactionFilters = {};

    const date = searchParams.get("date");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const search = searchParams.get("search");
    const cardId = searchParams.get("card_id");
    const bankId = searchParams.get("bank_id");
    const budgetId = searchParams.get("budget_id");
    const paymentMethod = searchParams.get("payment_method");
    const timezone = searchParams.get("timezone");

    if (date) filters.date = date;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    if (search) filters.search = search;
    if (cardId) filters.card_id = cardId;
    if (bankId) filters.bank_id = bankId;
    if (budgetId) filters.budget_id = budgetId;
    if (paymentMethod === "card" || paymentMethod === "transfer")
      filters.payment_method = paymentMethod;
    if (timezone) filters.timezone = timezone;

    console.log("GET /api/transactions -> filters", filters);

    const service = new TransactionsService();
    const data = await service.getAll(filters);

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/transactions error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionInsert = await request.json();

    console.log("POST /api/transactions -> body", body);

    const service = new TransactionsService();
    const data = await service.create(body);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/transactions error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
