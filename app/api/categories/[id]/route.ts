import { NextRequest, NextResponse } from "next/server";
import { CategoriesRepository } from "@/app/api/categories/repository";
import { CategoryUpdate } from "@/app/api/categories/model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const categoriesRepository = new CategoriesRepository();
    const category = await categoriesRepository.getById(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("GET /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to get category" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const body: CategoryUpdate = await request.json();

    const categoriesRepository = new CategoriesRepository();
    const category = await categoriesRepository.update(id, body);

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("PATCH /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const categoriesRepository = new CategoriesRepository();
    await categoriesRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
