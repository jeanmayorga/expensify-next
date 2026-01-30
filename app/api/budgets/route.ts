import { NextRequest, NextResponse } from "next/server";
import { BudgetsRepository } from "@/app/api/budgets/repository";
import { BudgetInsert } from "@/app/api/budgets/model";

export async function GET() {
  try {
    const budgetsRepository = new BudgetsRepository();
    const budgets = await budgetsRepository.getAll();

    return NextResponse.json({ data: budgets });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { error: "Failed to get budgets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BudgetInsert = await request.json();

    const budgetsRepository = new BudgetsRepository();
    const budget = await budgetsRepository.create(body);

    return NextResponse.json({ data: budget });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 },
    );
  }
}
