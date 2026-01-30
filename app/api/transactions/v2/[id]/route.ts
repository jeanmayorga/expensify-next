import { NextRequest, NextResponse } from "next/server";
import { ExpensifyTransactionsService } from "@/app/api/transactions/v2/service";
import { ExpensifyTransactionUpdate } from "@/app/api/transactions/v2/model";
import { getErrorMessage } from "@/utils/handle-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const expensifyTransactionsService = new ExpensifyTransactionsService();
    const data = await expensifyTransactionsService.getById(numId);

    if (!data) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/transactions/v2/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const body: ExpensifyTransactionUpdate = await request.json();

    const expensifyTransactionsService = new ExpensifyTransactionsService();
    const data = await expensifyTransactionsService.update(numId, body);

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("PATCH /api/transactions/v2/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const expensifyTransactionsService = new ExpensifyTransactionsService();
    const success = await expensifyTransactionsService.delete(numId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete transaction" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("DELETE /api/transactions/v2/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
