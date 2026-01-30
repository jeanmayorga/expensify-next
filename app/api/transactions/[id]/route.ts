import { NextRequest, NextResponse } from "next/server";
import { TransactionsService } from "@/app/api/transactions/service";
import { TransactionUpdate } from "@/app/api/transactions/model";
import { getErrorMessage } from "@/utils/handle-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const body: TransactionUpdate = await request.json();

    const transactionsService = new TransactionsService();
    const transaction = await transactionsService.update(numId, body);

    return NextResponse.json({ data: transaction });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("PATCH /api/transactions/[id] error:", message);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numId = Number(id);

    const transactionsService = new TransactionsService();
    const success = await transactionsService.delete(numId);

    return NextResponse.json({ data: success });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("DELETE /api/transactions/[id] error:", message);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
