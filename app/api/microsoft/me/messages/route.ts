import { getErrorMessage } from "@/utils/handle-error";
import { getMicrosoftAccessToken } from "../../auth";
import { MessagesService } from "./service";

export async function GET() {
  try {
    console.log("GET /api/microsoft/me/messages");
    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new MessagesService(accessToken);
    const messages = await service.getMessages();

    return Response.json({ data: messages });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/me/messages error:", message);
    return Response.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
