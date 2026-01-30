import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/utils/handle-error";
import {
  OpenAIService,
  ExtractionContext,
  ImageExtractionHints,
} from "@/app/api/openai/service";
import { BanksRepository } from "@/app/api/banks/repository";
import { CardsRepository } from "@/app/api/cards/repository";
import { CategoriesRepository } from "@/app/api/categories/repository";

interface FromImageRequest {
  image: string;
  mimeType: string;
  context?: ExtractionContext;
  hints?: ImageExtractionHints;
}

export async function POST(request: NextRequest) {
  try {
    const body: FromImageRequest = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 },
      );
    }

    if (!body.mimeType) {
      return NextResponse.json(
        { error: "mimeType is required" },
        { status: 400 },
      );
    }

    console.log(
      `POST /api/transactions/from-image -> mimeType=${body.mimeType}, imageLength=${body.image.length}`,
    );

    // Build context from database if not provided
    let context = body.context;
    if (!context) {
      const [banks, cards, categories] = await Promise.all([
        new BanksRepository().getAll(),
        new CardsRepository().getAll(),
        new CategoriesRepository().getAll(),
      ]);

      context = {
        banks: banks.map((b) => ({ id: b.id, name: b.name })),
        cards: cards.map((c) => ({
          id: c.id,
          name: c.name,
          last4: c.last4,
          bank_id: c.bank_id,
        })),
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
      };
    }

    const openaiService = new OpenAIService();
    const transaction = await openaiService.getTransactionFromImage(
      body.image,
      body.mimeType,
      context,
      body.hints,
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Failed to extract transaction from image" },
        { status: 422 },
      );
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/transactions/from-image error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
