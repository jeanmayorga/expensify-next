import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/utils/handle-error";
import {
  OpenAIService,
  ExtractionContext,
  ImageExtractionHints,
} from "@/app/api/openai/service";
import { BanksRepository } from "@/app/api/banks/repository";
import { CardsRepository } from "@/app/api/cards/repository";

interface FromImageBulkRequest {
  /** Text content - required. Can be transaction text or context for the image */
  text: string;
  /** Optional image - when provided, text is used as context for image extraction */
  image?: string;
  mimeType?: string;
  context?: ExtractionContext;
  hints?: ImageExtractionHints;
}

export async function POST(request: NextRequest) {
  try {
    const body: FromImageBulkRequest = await request.json();

    if (!body.text || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 },
      );
    }

    const hasImage = !!body.image?.trim();
    if (hasImage && !body.mimeType) {
      return NextResponse.json(
        { error: "mimeType is required when image is provided" },
        { status: 400 },
      );
    }

    console.log(
      `POST /api/transactions/from-image-bulk -> hasImage=${hasImage}, textLength=${body.text.length}`,
    );

    // Build context from database if not provided
    let context = body.context;
    if (!context) {
      const [banks, cards] = await Promise.all([
        new BanksRepository().getAll(),
        new CardsRepository().getAll(),
      ]);

      context = {
        banks: banks.map((b) => ({ id: b.id, name: b.name })),
        cards: cards.map((c) => ({
          id: c.id,
          name: c.name,
          last4: c.last4,
          bank_id: c.bank_id,
        })),
      };
    }

    const openaiService = new OpenAIService();
    const text = body.text.trim();

    const transactions = hasImage
      ? await openaiService.getTransactionsFromImage(
          body.image!,
          body.mimeType!,
          context,
          { ...body.hints, userContext: text },
        )
      : await openaiService.getTransactionsFromText(
          text,
          context,
          body.hints,
        );

    return NextResponse.json({ data: transactions });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/transactions/from-image-bulk error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
