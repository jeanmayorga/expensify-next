import { NextRequest, NextResponse } from "next/server";
import { BudgetAssignmentsService } from "@/app/api/assignments/service";
import { getErrorMessage } from "@/utils/handle-error";

interface RouteParams {
  params: Promise<{ transactionId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = await params;
    const numId = Number(transactionId);

    const budgetAssignmentsService = new BudgetAssignmentsService();
    const success = await budgetAssignmentsService.delete(numId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete assignment" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("DELETE /api/assignments/[transactionId] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
