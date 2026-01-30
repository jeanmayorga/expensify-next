import { NextRequest, NextResponse } from "next/server";
import { CardsRepository } from "@/app/api/cards/repository";
import { CardUpdate } from "@/app/api/cards/model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cardsRepository = new CardsRepository();
    const card = await cardsRepository.getById(id);

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ data: card });
  } catch (error) {
    console.error("GET /api/cards/[id] error:", error);
    return NextResponse.json({ error: "Failed to get card" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const body = (await request.json()) as CardUpdate;

    const cardsRepository = new CardsRepository();
    const card = await cardsRepository.update(id, body);

    return NextResponse.json({ data: card });
  } catch (error) {
    console.error("PATCH /api/cards/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cardsRepository = new CardsRepository();
    await cardsRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/cards/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 },
    );
  }
}
