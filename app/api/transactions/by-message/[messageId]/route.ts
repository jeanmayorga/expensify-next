import { NextRequest } from "next/server";
import { TransactionsService } from "@/app/api/transactions/service";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const { messageId } = await params;
    console.log("GET /api/transactions/by-message/[messageId]", messageId);

    const service = new TransactionsService();
    const transaction = await service.getByIncomeMessageId(messageId);

    return Response.json({ data: transaction });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/transactions/by-message error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
