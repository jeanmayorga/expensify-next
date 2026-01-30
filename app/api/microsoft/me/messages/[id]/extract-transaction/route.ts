import { NextRequest } from "next/server";
import { getErrorMessage } from "@/utils/handle-error";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";
import { extractTransactionData } from "@/app/api/microsoft/extraction/extract-transaction-data";

/**
 * GET /api/microsoft/me/messages/[id]/extract-transaction
 *
 * Fetches the message by ID, validates it against bank whitelist and subject,
 * runs the appropriate extractor by subject, and returns JSON ready to create
 * a transaction: { data: TransactionInsert }.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("GET /api/microsoft/me/messages/[id]/extract-transaction", id);

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await extractTransactionData(id, accessToken);

    if ("error" in result) {
      return Response.json(
        { error: result.error },
        { status: result.error === "Message not found" ? 404 : 400 },
      );
    }

    return Response.json({ data: result.data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(
      "GET /api/microsoft/me/messages/[id]/extract-transaction error:",
      message,
    );
    return Response.json({ error: message }, { status: 500 });
  }
}
