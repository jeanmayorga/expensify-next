import { NextRequest, NextResponse } from "next/server";
import { RedisService } from "@/app/api/redis/service";
import { MicrosoftService } from "@/app/api/microsoft/service";
import { MessagesService } from "@/app/api/microsoft/me/messages/service";
import { OpenAIService } from "@/app/api/openai/service";
import { TransactionsService } from "@/app/api/transactions/service";
import { getErrorMessage } from "@/utils/handle-error";

const EMAIL_WHITELIST = [
  "pauldhmayorgaw@gmail.com",
  "bancaenlinea@produbanco.com",
  "xperta@pichincha.com",
  "notificaciones@infopacificard.com.ec",
  "bancavirtual@bancoguayaquil.com",
  "banco@pichincha.com",
  "servicios@tarjetasbancopichincha.com",
];

interface WebhookNotification {
  resourceData?: { id?: string };
  resource?: string;
}

interface WebhookPayload {
  value?: WebhookNotification[];
}

export async function POST(request: NextRequest) {
  console.log("POST /api/microsoft/webhook");

  try {
    const { searchParams } = request.nextUrl;
    const validationToken = searchParams.get("validationToken");

    if (validationToken) {
      console.log(
        "POST /api/microsoft/webhook -> validationToken",
        validationToken,
      );
      return new Response(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const payload: WebhookPayload = await request.json();
    const emails = payload.value || [];

    const redisService = new RedisService();
    const homeAccountId = await redisService.get("homeAccountId");
    if (!homeAccountId) {
      return NextResponse.json(
        { error: "No account available." },
        { status: 500 },
      );
    }

    const microsoftService = new MicrosoftService();
    const token = await microsoftService.getAccessToken(homeAccountId);
    if (!token) {
      return NextResponse.json(
        { error: "No token available." },
        { status: 500 },
      );
    }

    console.log("POST /api/microsoft/webhook -> emails", emails.length);
    for (const notification of emails) {
      const messageId =
        notification?.resourceData?.id ||
        notification?.resource?.split("/").pop();
      if (!messageId) {
        console.log("No messageId found.", notification);
        continue;
      }

      const messageService = new MessagesService(token);
      const message = await messageService.getMessageById(messageId);
      if (!message) {
        console.log("No message found.", messageId);
        continue;
      }

      if (!EMAIL_WHITELIST.includes(message.from)) {
        console.log("Email not in whitelist.", message.from);
        continue;
      }

      if (!message.body) {
        console.log("No message body found.", message);
        continue;
      }

      const transactionsService = new TransactionsService();
      const transaction = await transactionsService.getByMessageId(messageId);
      if (transaction) {
        console.log("Transaction already exists.", messageId);
        continue;
      }

      const openaiService = new OpenAIService();
      const transactionGenerated = await openaiService.getTransactionFromEmail(
        message.body,
      );
      if (!transactionGenerated) {
        console.log("No transactionGenerated found.", messageId);
        continue;
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

    return new Response(null, { status: 202 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/microsoft/webhook error:", message);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
