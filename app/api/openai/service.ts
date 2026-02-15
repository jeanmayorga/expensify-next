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
}

/**
 * Build the JSON schema dynamically based on context
 */
function buildTransactionSchema(context: ExtractionContext) {
  const bankIds = context.banks.map((b) => b.id);
  const cardIds = context.cards.map((c) => c.id);

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
    },
    required: [
      "type",
      "description",
      "amount",
      "occurred_at",
      "bank_id",
      "card_id",
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
}

function buildContextInfo(context: ExtractionContext): {
  banksInfo: string;
  cardsInfo: string;
} {
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

  return { banksInfo, cardsInfo };
}

function buildExtractionPrompt(context: ExtractionContext): string {
  const { banksInfo, cardsInfo } = buildContextInfo(context);

  return `You are a helpful assistant that extracts transaction information from HTML emails.

## Available Banks:
${banksInfo}

## Available Cards:
${cardsInfo}

## Instructions:
1. Extract type (income/expense), description, amount, and date/time
2. Match the bank by name from the email sender or content
3. Match the card by last 4 digits if present (look for patterns like "****1234" or "ending in 1234")
4. For dates, convert Ecuador time (UTC-5) to UTC format
5. For amounts, use positive numbers only
6. Return null for card_id if you cannot determine it with confidence
`;
}

export interface ImageExtractionHints {
  userContext?: string;
  preselectedBankId?: string | null;
  preselectedCardId?: string | null;
  preselectedBudgetId?: string | null;
}

function buildImageExtractionPrompt(
  context: ExtractionContext,
  hints?: ImageExtractionHints,
): string {
  const { banksInfo, cardsInfo } = buildContextInfo(context);

  let hintsSection = "";
  if (hints?.userContext) {
    hintsSection += `\n## User provided context:\n${hints.userContext}\n`;
  }
  if (hints?.preselectedBankId) {
    const bank = context.banks.find((b) => b.id === hints.preselectedBankId);
    if (bank) {
      hintsSection += `\n## Pre-selected bank: ${bank.name} (id: ${bank.id}) - USE THIS bank_id\n`;
    }
  }
  if (hints?.preselectedCardId) {
    const card = context.cards.find((c) => c.id === hints.preselectedCardId);
    if (card) {
      hintsSection += `\n## Pre-selected card: ${card.name} (id: ${card.id}) - USE THIS card_id\n`;
    }
  }

  return `You are a strict assistant that extracts transaction information from receipt or invoice images.

## Available Banks:
${banksInfo}

## Available Cards:
${cardsInfo}
${hintsSection}
## CRITICAL INSTRUCTIONS FOR AMOUNT:
- The amount MUST be the TOTAL amount paid, NOT subtotals, taxes, or tips separately
- Look for labels like: "TOTAL", "GRAND TOTAL", "TOTAL A PAGAR", "MONTO TOTAL", "AMOUNT DUE", "BALANCE DUE"
- The total is usually the LARGEST number at the bottom of the receipt
- If there's a "TOTAL" and a "SUBTOTAL", always use "TOTAL"
- The amount must be a positive decimal number (e.g., 25.50, not $25.50)
- DO NOT include currency symbols in the amount
- If you see multiple totals, use the final/grand total

## CRITICAL INSTRUCTIONS FOR DATE:
- Extract the EXACT date shown on the receipt
- Common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, "Jan 15, 2025", "15 Ene 2025"
- Look for labels like: "FECHA", "DATE", "Fecha de compra", "Transaction Date"
- The date is usually near the top of the receipt or near the transaction details
- Convert the date to UTC format: YYYY-MM-DDTHH:mm:ssZ
- If only date is shown (no time), use 12:00:00 as the time
- Assume Ecuador timezone (UTC-5) for the conversion
- If no date is visible, use current date: ${new Date().toISOString()}

## OTHER INSTRUCTIONS:
1. Type is almost always "expense" for receipts (use "income" only for refunds)
2. Description should be the merchant/store name visible on the receipt
3. Match card by last 4 digits if visible (patterns: "****1234", "ending in 1234", "XXXX1234")
4. If pre-selected values are provided above, USE THEM
5. Return null for bank_id or card_id ONLY if not pre-selected AND cannot be determined
`;
}

function buildBulkTransactionSchema(context: ExtractionContext) {
  const bankIds = context.banks.map((b) => b.id);
  const cardIds = context.cards.map((c) => c.id);

  return {
    type: "object",
    properties: {
      transactions: {
        type: "array",
        description: "Array of all transactions found in the image",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["income", "expense"],
              description:
                "Whether this is an income or expense. Credits/deposits are income, debits/purchases are expense.",
            },
            description: {
              type: "string",
              description:
                "Description of the transaction (merchant name, transfer description, etc.)",
            },
            amount: {
              type: "number",
              description: "The monetary amount as a positive number",
              minimum: 0,
            },
            occurred_at: {
              type: "string",
              description: `Transaction date in UTC format: YYYY-MM-DDTHH:mm:ssZ`,
              pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$",
            },
            bank_id: {
              type: "string",
              description: "The UUID of the bank",
              enum: bankIds,
            },
            card_id: {
              type: ["string", "null"],
              description:
                "The UUID of the card if identifiable by last 4 digits, null otherwise",
              enum: [...cardIds, null],
            },
          },
          required: [
            "type",
            "description",
            "amount",
            "occurred_at",
            "bank_id",
            "card_id",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["transactions"],
    additionalProperties: false,
  } as const;
}

function buildBulkImageExtractionPrompt(
  context: ExtractionContext,
  hints?: ImageExtractionHints,
): string {
  const { banksInfo, cardsInfo } = buildContextInfo(context);

  let hintsSection = "";
  if (hints?.userContext) {
    hintsSection += `\n## User provided context:\n${hints.userContext}\n`;
  }
  if (hints?.preselectedBankId) {
    const bank = context.banks.find((b) => b.id === hints.preselectedBankId);
    if (bank) {
      hintsSection += `\n## Pre-selected bank: ${bank.name} (id: ${bank.id}) - USE THIS bank_id FOR ALL TRANSACTIONS\n`;
    }
  }
  if (hints?.preselectedCardId) {
    const card = context.cards.find((c) => c.id === hints.preselectedCardId);
    if (card) {
      hintsSection += `\n## Pre-selected card: ${card.name} (id: ${card.id}) - USE THIS card_id FOR ALL TRANSACTIONS\n`;
    }
  }

  return `You are an expert assistant that extracts MULTIPLE transactions from bank statements, account statements, or images containing several transactions.

## Available Banks:
${banksInfo}

## Available Cards:
${cardsInfo}
${hintsSection}
## CRITICAL INSTRUCTIONS:
1. Extract ALL transactions visible in the image - do not skip any
2. Each row/line item in a statement is typically ONE transaction
3. For bank statements, look for columns like: Date, Description, Debit, Credit, Balance

## FOR EACH TRANSACTION:
- **type**: "expense" for debits/purchases/withdrawals, "income" for credits/deposits/refunds
- **description**: The merchant name or transaction description shown
- **amount**: ALWAYS a positive number (the absolute value of the amount)
- **occurred_at**: The transaction date in UTC format (YYYY-MM-DDTHH:mm:ssZ)
  - If only date shown, use 12:00:00 as time
  - Assume Ecuador timezone (UTC-5) and convert to UTC

## DATE EXTRACTION:
- Look for date columns or date prefixes on each transaction
- Common formats: DD/MM/YYYY, MM/DD/YYYY, DD-MMM-YYYY, "15 Ene", "Jan 15"
- If year is not shown, assume current year: ${new Date().getFullYear()}
- Convert all dates to UTC format

## AMOUNT EXTRACTION:
- Extract the transaction amount, NOT the balance
- If there are separate Debit/Credit columns, use those values
- Amount must be positive (absolute value)
- Do NOT include currency symbols

## If pre-selected values are provided above, apply them to ALL transactions.
`;
}

function buildBulkTextExtractionPrompt(
  context: ExtractionContext,
  hints?: ImageExtractionHints,
): string {
  const { banksInfo, cardsInfo } = buildContextInfo(context);

  let hintsSection = "";
  if (hints?.userContext) {
    hintsSection += `\n## User provided context:\n${hints.userContext}\n`;
  }
  if (hints?.preselectedBankId) {
    const bank = context.banks.find((b) => b.id === hints.preselectedBankId);
    if (bank) {
      hintsSection += `\n## Pre-selected bank: ${bank.name} (id: ${bank.id}) - USE THIS bank_id FOR ALL TRANSACTIONS\n`;
    }
  }
  if (hints?.preselectedCardId) {
    const card = context.cards.find((c) => c.id === hints.preselectedCardId);
    if (card) {
      hintsSection += `\n## Pre-selected card: ${card.name} (id: ${card.id}) - USE THIS card_id FOR ALL TRANSACTIONS\n`;
    }
  }

  return `You are an expert assistant that extracts MULTIPLE transactions from free text, bank statement text, or transaction descriptions.

## Available Banks:
${banksInfo}

## Available Cards:
${cardsInfo}
${hintsSection}
## INSTRUCTIONS:
1. Extract ALL transactions mentioned in the text - each line/item is typically ONE transaction
2. The text can be: a single transaction ("Café $5"), multiple lines, or full bank statement copy-paste
3. Match bank/card by name or last 4 digits when mentioned

## FOR EACH TRANSACTION:
- **type**: "expense" for purchases/debits/withdrawals, "income" for credits/deposits/refunds
- **description**: The merchant name or transaction description
- **amount**: ALWAYS a positive number (absolute value)
- **occurred_at**: UTC format (YYYY-MM-DDTHH:mm:ssZ). If no date, use today. Assume Ecuador timezone (UTC-5)
- **bank_id**: Match from context if mentioned, otherwise use first bank
- **card_id**: Match by last 4 digits if present, null otherwise

## If pre-selected values are provided above, apply them to ALL transactions.
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
        `Context: ${context.banks.length} banks, ${context.cards.length} cards`,
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

  async getTransactionFromImage(
    imageBase64: string,
    mimeType: string,
    context: ExtractionContext,
    hints?: ImageExtractionHints,
  ): Promise<ParsedTransaction | null> {
    try {
      console.log(
        `OpenAIService->getTransactionFromImage() mimeType=${mimeType}`,
      );
      console.log(
        `Context: ${context.banks.length} banks, ${context.cards.length} cards`,
      );
      if (hints) {
        console.log(`Hints: ${JSON.stringify(hints)}`);
      }

      const systemPrompt = buildImageExtractionPrompt(context, hints);
      const schema = buildTransactionSchema(context);

      const userMessage = hints?.userContext
        ? `Extract the transaction information from this receipt or invoice image. Additional context from user: ${hints.userContext}`
        : "Extract the transaction information from this receipt or invoice image.";

      // gpt-4o-mini supports vision and structured outputs
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: userMessage,
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transaction",
            schema,
            strict: true,
          },
        },
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("OpenAIService->getTransactionFromImage() no content");
        return null;
      }

      const parsed = JSON.parse(content);
      return parsed as ParsedTransaction;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(
        "OpenAIService->getTransactionFromImage()->error",
        errorMessage,
      );
      return null;
    }
  }

  async getTransactionsFromImage(
    imageBase64: string,
    mimeType: string,
    context: ExtractionContext,
    hints?: ImageExtractionHints,
  ): Promise<ParsedTransaction[]> {
    try {
      console.log(
        `OpenAIService->getTransactionsFromImage() mimeType=${mimeType}`,
      );
      console.log(
        `Context: ${context.banks.length} banks, ${context.cards.length} cards`,
      );
      if (hints) {
        console.log(`Hints: ${JSON.stringify(hints)}`);
      }

      const systemPrompt = buildBulkImageExtractionPrompt(context, hints);
      const schema = buildBulkTransactionSchema(context);

      const userMessage = hints?.userContext
        ? `Extract ALL transactions from this bank statement or document. Additional context: ${hints.userContext}`
        : "Extract ALL transactions from this bank statement or document. Return every transaction you can identify.";

      // gpt-4o-mini supports vision and structured outputs
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: userMessage,
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transactions_list",
            schema,
            strict: true,
          },
        },
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error(
          "OpenAIService->getTransactionsFromImage() no content",
        );
        return [];
      }

      const parsed = JSON.parse(content);
      console.log(
        `OpenAIService->getTransactionsFromImage() extracted ${parsed.transactions?.length || 0} transactions`,
      );
      return (parsed.transactions || []) as ParsedTransaction[];
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(
        "OpenAIService->getTransactionsFromImage()->error",
        errorMessage,
      );
      return [];
    }
  }

  async getTransactionsFromText(
    text: string,
    context: ExtractionContext,
    hints?: ImageExtractionHints,
  ): Promise<ParsedTransaction[]> {
    try {
      console.log(
        `OpenAIService->getTransactionsFromText() textLength=${text.length}`,
      );
      console.log(
        `Context: ${context.banks.length} banks, ${context.cards.length} cards`,
      );

      const systemPrompt = buildBulkTextExtractionPrompt(context, hints);
      const schema = buildBulkTransactionSchema(context);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Extract ALL transactions from this text:\n\n${text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transactions_list",
            schema,
            strict: true,
          },
        },
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("OpenAIService->getTransactionsFromText() no content");
        return [];
      }

      const parsed = JSON.parse(content);
      console.log(
        `OpenAIService->getTransactionsFromText() extracted ${parsed.transactions?.length || 0} transactions`,
      );
      return (parsed.transactions || []) as ParsedTransaction[];
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(
        "OpenAIService->getTransactionsFromText()->error",
        errorMessage,
      );
      return [];
    }
  }
}
