import { MessagesService } from "@/app/api/microsoft/me/messages/service";
import { BanksRepository } from "@/app/api/banks/repository";
import { TransactionsService } from "@/app/api/transactions/service";
import { buildTransactionInsertFromEmail } from "@/app/api/microsoft/extraction/extract-transaction-data";

export interface WebhookEmailNotification {
  resourceData?: { id?: string };
  resource?: string;
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
  if (!message.body?.trim()) {
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

  // Extract and build TransactionInsert (rule-based by bank + subject)
  const data = await buildTransactionInsertFromEmail(message, bank, messageId);
  if (!data) {
    console.log("No extractor for this bank and subject", message.subject);
    return;
  }

  await transactionsService.create(data);
  console.log("Transaction created", messageId);
}
