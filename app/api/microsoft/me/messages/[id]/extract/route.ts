import { NextRequest } from "next/server";
import { getErrorMessage } from "@/utils/handle-error";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";
import { extractTransactionFromEmail } from "@/app/api/microsoft/webhook/handle-email-notification";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("POST /api/microsoft/me/messages/[id]/extract", id);

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await extractTransactionFromEmail(id, accessToken);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ data: result.transaction });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(
      "POST /api/microsoft/me/messages/[id]/extract error:",
      message,
    );
    return Response.json({ error: message }, { status: 500 });
  }
}
