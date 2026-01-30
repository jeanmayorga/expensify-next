import OpenAI from "openai";
import { env } from "@/app/config/env";
import { getErrorMessage } from "@/utils/handle-error";

/**
 * Context for OpenAI to match entities
 */
export interface ExtractionContext {
  banks: Array<{ id: string; name: string }>;
  cards: Array<{
    id: string;
    name: string;
    last4: string | null;
    bank_id: string | null;
  }>;
  categories: Array<{ id: string; name: string }>;
}

/**
 * Build the JSON schema dynamically based on context
 */
function buildTransactionSchema(context: ExtractionContext) {
  const bankIds = context.banks.map((b) => b.id);
  const cardIds = context.cards.map((c) => c.id);
  const categoryIds = context.categories.map((c) => c.id);

  return {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["income", "expense"],
        description:
          "Whether this is an income or expense transaction. If it is a refund, return income.",
      },
      description: {
        type: "string",
        description:
          "A clear description of the transaction (e.g., 'Coffee at Starbucks', 'Salary payment')",
      },
      amount: {
        type: "number",
        description:
          "The monetary amount of the transaction as a positive number",
        minimum: 0,
      },
      occurred_at: {
        type: "string",
        description: `The date and time when the transaction occurred. The date in the email is in Ecuador time (UTC-5), convert it to UTC. Format: YYYY-MM-DDTHH:mm:ssZ. If not present use: ${new Date().toISOString()}`,
        pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$",
      },
      bank_id: {
        type: "string",
        description:
          "The UUID of the bank. Match based on the bank name in the email.",
        enum: bankIds,
      },
      card_id: {
        type: ["string", "null"],
        description:
          "The UUID of the card used. Match by last 4 digits if present in the email. Return null if not found.",
        enum: [...cardIds, null],
      },
      category_id: {
        type: ["string", "null"],
        description:
          "The UUID of the category. Infer from the transaction description/merchant. Return null if uncertain.",
        enum: [...categoryIds, null],
      },
    },
    required: [
      "type",
      "description",
      "amount",
      "occurred_at",
      "bank_id",
      "card_id",
      "category_id",
    ],
    additionalProperties: false,
  } as const;
}

export interface ParsedTransaction {
  type: "income" | "expense";
  description: string;
  amount: number;
  occurred_at: string;
  bank_id: string;
  card_id: string | null;
  category_id: string | null;
}

function buildExtractionPrompt(context: ExtractionContext): string {
  const banksInfo = context.banks
    .map((b) => `- ${b.name} (id: ${b.id})`)
    .join("\n");

  const cardsInfo = context.cards
    .map((c) => {
      const bankName =
        context.banks.find((b) => b.id === c.bank_id)?.name || "Unknown";
      return `- ${c.name} (last4: ${c.last4 || "N/A"}, bank: ${bankName}, id: ${c.id})`;
    })
    .join("\n");

  const categoriesInfo = context.categories
    .map((c) => `- ${c.name} (id: ${c.id})`)
    .join("\n");

  return `You are a helpful assistant that extracts transaction information from HTML emails.

## Available Banks:
${banksInfo}

## Available Cards:
${cardsInfo}

## Available Categories:
${categoriesInfo}

## Instructions:
1. Extract type (income/expense), description, amount, and date/time
2. Match the bank by name from the email sender or content
3. Match the card by last 4 digits if present (look for patterns like "****1234" or "ending in 1234")
4. Infer the category based on the merchant/description (e.g., restaurants -> Food, supermarkets -> Groceries)
5. For dates, convert Ecuador time (UTC-5) to UTC format
6. For amounts, use positive numbers only
7. Return null for card_id or category_id if you cannot determine them with confidence
`;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  private createStructuredResponse(
    emailContent: string,
    context: ExtractionContext,
    bankPrompt?: string | null,
  ) {
    const basePrompt = buildExtractionPrompt(context);
    const systemPrompt = bankPrompt
      ? `${basePrompt}\n\n## Bank-specific instructions:\n${bankPrompt}`
      : basePrompt;

    const schema = buildTransactionSchema(context);

    // gpt-5-nano: modelo más barato con Structured Outputs (json_schema) en Responses API
    // https://platform.openai.com/docs/pricing
    return this.openai.responses.create({
      model: "gpt-5-nano",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: emailContent },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "transaction",
          schema,
          strict: true,
        },
      },
    });
  }

  async getTransactionFromEmail(
    emailContent: string,
    context: ExtractionContext,
    bankPrompt?: string | null,
  ): Promise<ParsedTransaction | null> {
    try {
      console.log(
        `OpenAIService->getTransactionFromEmail() ${emailContent.length} chars`,
      );
      console.log(
        `Context: ${context.banks.length} banks, ${context.cards.length} cards, ${context.categories.length} categories`,
      );

      const response = await this.createStructuredResponse(
        emailContent,
        context,
        bankPrompt,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outputText = (response as any).output_text as string;
      const parsed = JSON.parse(outputText);
      const transaction = parsed as ParsedTransaction;
      return transaction;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(
        "OpenAIService->getTransactionFromEmail()->error",
        errorMessage,
      );
      return null;
    }
  }
}
