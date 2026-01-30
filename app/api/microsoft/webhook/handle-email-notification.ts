import { MessagesService } from "@/app/api/microsoft/me/messages/service";
import { OpenAIService } from "@/app/api/openai/service";
import { TransactionsService } from "@/app/api/transactions/service";
import { Transaction } from "@/app/api/transactions/model";
import { BanksRepository } from "@/app/api/banks/repository";

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
 * Extract a transaction from an email by message ID
 */
export async function extractTransactionFromEmail(
  messageId: string,
  accessToken: string,
): Promise<ExtractTransactionResult> {
  // Get the message
  const messageService = new MessagesService(accessToken);
  const message = await messageService.getMessageById(messageId);
  if (!message) {
    return { success: false, error: "Message not found" };
  }

  // Find bank by email (also validates whitelist)
  const banksRepository = new BanksRepository();
  const bank = await banksRepository.getByEmail(message.from);
  if (!bank) {
    return { success: false, error: "Email not in whitelist" };
  }

  // Check body
  if (!message.body) {
    return { success: false, error: "No message body found" };
  }

  // Check if transaction already exists
  const transactionsService = new TransactionsService();
  const existingTransaction =
    await transactionsService.getByIncomeMessageId(messageId);
  if (existingTransaction) {
    return {
      success: true,
      transaction: existingTransaction,
      error: "Transaction already exists",
    };
  }

  console.log(`Extracting transaction for bank: ${bank.name}`);

  // Extract transaction using OpenAI with bank-specific prompt
  const openaiService = new OpenAIService();
  const transactionGenerated = await openaiService.getTransactionFromEmail(
    message.body,
    bank.extraction_prompt,
  );
  if (!transactionGenerated) {
    return {
      success: false,
      error: "Could not extract transaction from email",
    };
  }

  // Create the transaction with bank_id
  const newTransaction = await transactionsService.create({
    type: transactionGenerated.type,
    description: transactionGenerated.description,
    amount: transactionGenerated.amount,
    occurred_at: transactionGenerated.occurred_at,
    income_message_id: messageId,
    bank_id: bank.id,
  });

  return { success: true, transaction: newTransaction };
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

  const result = await extractTransactionFromEmail(messageId, accessToken);
  if (result.success) {
    console.log("Transaction processed.", result.transaction?.id);
  } else {
    console.log("Failed to process:", result.error);
  }
}
