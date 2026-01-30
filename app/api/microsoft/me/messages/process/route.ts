import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";
import { MessagesService } from "../service";
import { OpenAIService } from "@/app/api/openai/service";
import { TransactionsService } from "@/app/api/transactions/service";
import { getErrorMessage } from "@/utils/handle-error";

interface ProcessMessageBody {
  id: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/microsoft/me/messages/process");

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    const body: ProcessMessageBody = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 },
      );
    }

    const messageService = new MessagesService(accessToken);
    const message = await messageService.getMessageById(id);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const openaiService = new OpenAIService();
    const transactionGenerated = await openaiService.getTransactionFromEmail(
      message.body,
    );

    if (!transactionGenerated) {
      return NextResponse.json(
        { error: "Transaction could not be extracted" },
        { status: 422 },
      );
    }

    const transactionsService = new TransactionsService();
    const oldTransaction = await transactionsService.getByIncomeMessageId(id);

    if (!oldTransaction) {
      return NextResponse.json(
        { error: "Original transaction not found" },
        { status: 404 },
      );
    }

    const newTransaction = await transactionsService.update(oldTransaction.id, {
      type: transactionGenerated.type,
      description: transactionGenerated.description,
      amount: transactionGenerated.amount,
      occurred_at: transactionGenerated.occurred_at,
      income_message_id: id,
    });
    console.log("updatedTransaction saved ->", newTransaction?.id);

    return NextResponse.json({ data: newTransaction });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(
      "POST /api/microsoft/me/messages/process error:",
      errorMessage,
    );
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 },
    );
  }
}
