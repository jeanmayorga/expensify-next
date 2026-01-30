import { NextRequest, NextResponse } from "next/server";
import { RedisService } from "@/app/api/redis/service";
import { MicrosoftService } from "@/app/api/microsoft/service";
import {
  handleEmailNotification,
  type WebhookEmailNotification,
} from "./handle-email-notification";
import { getErrorMessage } from "@/utils/handle-error";

interface WebhookPayload {
  value?: WebhookEmailNotification[];
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/microsoft/webhook");
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
      await handleEmailNotification(notification, token);
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
