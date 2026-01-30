import { NextRequest, NextResponse } from "next/server";
import { TransactionsService } from "../service";
import { TransactionUpdate } from "../model";
import { getErrorMessage } from "@/utils/handle-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const transactionsService = new TransactionsService();
    const data = await transactionsService.getById(numId);

    if (!data) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/transactions/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const body: TransactionUpdate = await request.json();

    const transactionsService = new TransactionsService();
    const data = await transactionsService.update(numId, body);

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("PATCH /api/transactions/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const transactionsService = new TransactionsService();
    const success = await transactionsService.delete(numId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete transaction" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("DELETE /api/transactions/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
