import { NextRequest, NextResponse } from "next/server";
import { TransactionsService } from "./service";
import { TransactionInsert, TransactionFilters } from "./model";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: TransactionFilters = {};

    const month = searchParams.get("month");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const bankId = searchParams.get("bank_id");
    const budgetId = searchParams.get("budget_id");

    if (month) filters.month = month;
    if (date) filters.date = date;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type && (type === "expense" || type === "income")) filters.type = type;
    if (bankId) filters.bank_id = bankId;
    if (budgetId) filters.budget_id = budgetId;

    const transactionsService = new TransactionsService();
    const data = await transactionsService.getAll(filters);

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

    const transactionsService = new TransactionsService();
    const data = await transactionsService.create(body);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/transactions error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
