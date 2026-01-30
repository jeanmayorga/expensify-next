import { NextRequest, NextResponse } from "next/server";
import { BudgetAssignmentsService } from "@/app/api/assignments/service";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ data: {} });
    }

    const transactionIds = idsParam.split(",").map(Number).filter(Boolean);

    const budgetAssignmentsService = new BudgetAssignmentsService();
    const data =
      await budgetAssignmentsService.getByTransactionIds(transactionIds);

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/assignments error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface AssignmentPostBody {
  transaction_id: number;
  budget_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AssignmentPostBody = await request.json();
    const { transaction_id, budget_id } = body;

    if (!transaction_id || !budget_id) {
      return NextResponse.json(
        { error: "transaction_id and budget_id required" },
        { status: 400 },
      );
    }

    const budgetAssignmentsService = new BudgetAssignmentsService();
    const data = await budgetAssignmentsService.upsert(
      Number(transaction_id),
      budget_id,
    );

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/assignments error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
