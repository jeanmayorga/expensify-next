import { NextRequest } from "next/server";
import { getErrorMessage } from "@/utils/handle-error";
import { getMicrosoftAccessToken } from "../../auth";
import { MessagesService } from "./service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const timezoneOffset = searchParams.get("tz")
      ? parseInt(searchParams.get("tz")!)
      : 0;

    console.log("GET /api/microsoft/me/messages", {
      date,
      cursor,
      timezoneOffset,
    });

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new MessagesService(accessToken);
    const result = await service.getMessages(date, cursor, timezoneOffset);

    return Response.json({ data: result });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/me/messages error:", message);
    return Response.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
