import { NextResponse } from "next/server";
import { CardInsert } from "./model";
import { CardsRepository } from "./repository";

export async function GET() {
  try {
    const cardsRepository = new CardsRepository();
    const cards = await cardsRepository.getAll();

    return NextResponse.json({ data: cards });
  } catch (error) {
    console.error("GET /api/cards error:", error);
    return NextResponse.json({ error: "Failed to get cards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CardInsert = await request.json();

    const cardsRepository = new CardsRepository();
    const card = await cardsRepository.create(body);

    return NextResponse.json({ data: card });
  } catch (error) {
    console.error("Failed to create card", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 },
    );
  }
}
