import { NextRequest } from "next/server";
import { getErrorMessage } from "@/utils/handle-error";
import { getMicrosoftAccessToken } from "../../auth";
import { MessagesService } from "./service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;
    const month = searchParams.get("month") || undefined;
    const dateFrom = searchParams.get("date_from") || undefined;
    const dateTo = searchParams.get("date_to") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const timezoneOffset = searchParams.get("tz")
      ? parseInt(searchParams.get("tz")!)
      : 0;

    let resolvedDateFrom = dateFrom;
    let resolvedDateTo = dateTo;
    if (month && !dateFrom && !dateTo) {
      const [y, m] = month.split("-").map(Number);
      resolvedDateFrom = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      resolvedDateTo = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }

    console.log("GET /api/microsoft/me/messages", {
      date,
      month,
      dateFrom: resolvedDateFrom,
      dateTo: resolvedDateTo,
      cursor,
      timezoneOffset,
    });

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new MessagesService(accessToken);
    const result = await service.getMessages(
      resolvedDateFrom && resolvedDateTo ? undefined : date,
      cursor,
      timezoneOffset,
      resolvedDateFrom,
      resolvedDateTo,
    );

    return Response.json({ data: result });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/me/messages error:", message);
    return Response.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
