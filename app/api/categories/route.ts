import { NextRequest, NextResponse } from "next/server";
import { CategoriesRepository } from "@/app/api/categories/repository";
import { CategoryInsert } from "@/app/api/categories/model";

export async function GET() {
  try {
    const categoriesRepository = new CategoriesRepository();
    const categories = await categoriesRepository.getAll();

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to get categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CategoryInsert = await request.json();

    const categoriesRepository = new CategoriesRepository();
    const category = await categoriesRepository.create(body);

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
