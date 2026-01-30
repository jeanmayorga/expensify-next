import { NextRequest, NextResponse } from "next/server";
import { ExpensifyTransactionsService } from "@/app/api/transactions/v2/service";
import {
  ExpensifyTransactionInsert,
  TransactionFilters,
} from "@/app/api/transactions/v2/model";
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
    const bank = searchParams.get("bank");

    if (month) filters.month = month;
    if (date) filters.date = date;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type && (type === "expense" || type === "income")) filters.type = type;
    if (bank) filters.bank = bank;

    const expensifyTransactionsService = new ExpensifyTransactionsService();
    const data = await expensifyTransactionsService.getAll(filters);

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/transactions/v2 error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ExpensifyTransactionInsert = await request.json();

    const expensifyTransactionsService = new ExpensifyTransactionsService();
    const data = await expensifyTransactionsService.create(body);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/transactions/v2 error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
