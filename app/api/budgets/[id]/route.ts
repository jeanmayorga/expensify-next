import { NextRequest, NextResponse } from "next/server";
import { BudgetsRepository } from "@/app/api/budgets/repository";
import { BudgetUpdate } from "@/app/api/budgets/model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const budgetsRepository = new BudgetsRepository();
    const budget = await budgetsRepository.getById(id);

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ data: budget });
  } catch (error) {
    console.error("GET /api/budgets/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to get budget" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: BudgetUpdate = await request.json();

    const budgetsRepository = new BudgetsRepository();
    const budget = await budgetsRepository.update(id, body);

    return NextResponse.json({ data: budget });
  } catch (error) {
    console.error("PATCH /api/budgets/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const budgetsRepository = new BudgetsRepository();
    const success = await budgetsRepository.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete budget" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/budgets/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 },
    );
  }
}
