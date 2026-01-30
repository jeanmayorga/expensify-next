import { MessagesService } from "@/app/api/microsoft/me/messages/service";
import { OpenAIService } from "@/app/api/openai/service";
import { TransactionsService } from "@/app/api/transactions/service";
import { EMAIL_WHITELIST } from "@/lib/constants";

export interface WebhookEmailNotification {
  resourceData?: { id?: string };
  resource?: string;
}

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

  const messageService = new MessagesService(accessToken);
  const message = await messageService.getMessageById(messageId);
  if (!message) {
    console.log("No message found.", messageId);
    return;
  }

  if (!EMAIL_WHITELIST.includes(message.from)) {
    console.log("Email not in whitelist.", message.from);
    return;
  }

  if (!message.body) {
    console.log("No message body found.", message);
    return;
  }

  const transactionsService = new TransactionsService();
  const transaction = await transactionsService.getByIncomeMessageId(messageId);
  if (transaction) {
    console.log("Transaction already exists.", messageId);
    return;
  }

  const openaiService = new OpenAIService();
  const transactionGenerated = await openaiService.getTransactionFromEmail(
    message.body,
  );
  if (!transactionGenerated) {
    console.log("No transactionGenerated found.", messageId);
    return;
  }

  const newTransaction = await transactionsService.create({
    type: transactionGenerated.type,
    description: transactionGenerated.description,
    amount: transactionGenerated.amount,
    occurred_at: transactionGenerated.occurred_at,
    income_message_id: messageId,
    bank_id: null,
  });
  console.log("New transaction saved.", newTransaction?.id);
}
