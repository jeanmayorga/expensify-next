import { MessagesService } from "@/app/api/microsoft/me/messages/service";
import {
  OpenAIService,
  ExtractionContext,
  ParsedTransaction,
} from "@/app/api/openai/service";
import { TransactionsService } from "@/app/api/transactions/service";
import { Transaction } from "@/app/api/transactions/model";
import { BanksRepository } from "@/app/api/banks/repository";
import { CardsRepository } from "@/app/api/cards/repository";
import { CategoriesRepository } from "@/app/api/categories/repository";
import { extractInfoFromBancoPichincha } from "./extract-info-from-banco-pichincha";
import { extractInfoFromBancoPacifico } from "./extract-info-from-banco-pacifico";

export interface WebhookEmailNotification {
  resourceData?: { id?: string };
  resource?: string;
}

export interface ExtractTransactionResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

/**
 * Build extraction context from database
 */
async function buildExtractionContext(): Promise<ExtractionContext> {
  const [banks, cards, categories] = await Promise.all([
    new BanksRepository().getAll(),
    new CardsRepository().getAll(),
    new CategoriesRepository().getAll(),
  ]);

  return {
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

/**
 * Extract a transaction from an email by message ID
 */
export async function extractTransactionFromEmail(
  messageId: string,
  accessToken: string,
) {
  // Get the message
  const messageService = new MessagesService(accessToken);
  const message = await messageService.getMessageById(messageId);
  if (!message) {
    console.log("Message not found", messageId);
    return;
  }

  // Find bank by email (also validates whitelist)
  const banksRepository = new BanksRepository();
  const bank = await banksRepository.getByEmail(message.from);
  if (!bank) {
    console.log("Email not in whitelist", message.from);
    return;
  }

  // Check if subject is blacklisted for this bank
  const blacklistedSubjects = bank.blacklisted_subjects || [];
  const isBlacklisted = blacklistedSubjects.some((subject) =>
    message.subject?.toUpperCase().includes(subject.toUpperCase()),
  );
  if (isBlacklisted) {
    console.log("Subject blacklisted", message.subject);
    return;
  }

  // Check body
  if (!message.body) {
    console.log("No message body found", messageId);
    return;
  }

  // Check if transaction already exists
  const transactionsService = new TransactionsService();
  const existingTransaction =
    await transactionsService.getByIncomeMessageId(messageId);
  if (existingTransaction) {
    console.log("Transaction already exists", messageId);
    return;
  }

  console.log(`Extracting transaction for bank: ${bank.name}`);

  let bodyModified = message.body;
  if (bank.slug === "pichincha") {
    bodyModified = extractInfoFromBancoPichincha(message);
  }
  if (bank.slug === "pacifico") {
    bodyModified = extractInfoFromBancoPacifico(message);
  }

  const context = await buildExtractionContext();

  // Extract transaction using OpenAI with context and bank-specific prompt
  const openaiService = new OpenAIService();
  const extracted = await openaiService.getTransactionFromEmail(
    bodyModified,
    context,
    bank.extraction_prompt,
  );
  // }

  if (!extracted) {
    console.log("Could not extract transaction from email", messageId);
    return;
  }

  // Create the transaction with IDs from OpenAI
  await transactionsService.create({
    type: extracted.type,
    description: extracted.description,
    amount: extracted.amount,
    occurred_at: extracted.occurred_at,
    income_message_id: messageId,
    bank_id: extracted.bank_id,
    card_id: extracted.card_id,
    category_id: extracted.category_id,
  });

  console.log("Transaction created", messageId);
}

/**
 * Handle webhook notification (used by the webhook route)
 */
export async function handleEmailNotification(
  notification: WebhookEmailNotification,
  accessToken: string,
): Promise<void> {
  const messageId =
    notification?.resourceData?.id || notification?.resource?.split("/").pop();
  if (!messageId) {
    console.log("No messageId found.", notification);
    return;
  }

  await extractTransactionFromEmail(messageId, accessToken);
}
