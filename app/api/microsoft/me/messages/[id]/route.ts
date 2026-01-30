import { NextRequest } from "next/server";
import { MessagesService } from "../service";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("GET /api/microsoft/me/messages/:id", id);

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new MessagesService(accessToken);
    const message = await service.getMessageById(id);

    if (!message) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    return Response.json({ data: message });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/me/messages/:id error:", message);
    return Response.json({ error: "Failed to get message" }, { status: 500 });
  }
}
