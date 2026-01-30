import { NextResponse } from "next/server";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";
import { SubscriptionsService } from "./subscriptions.service";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET() {
  try {
    console.log("GET /api/microsoft/subscriptions");

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication failed." },
        { status: 401 },
      );
    }

    const subscriptionService = new SubscriptionsService(accessToken);
    const data = await subscriptionService.getSubscriptions();

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/subscriptions error:", message);
    return NextResponse.json(
      { error: "Failed to get subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    console.log("POST /api/microsoft/subscriptions");

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    const subscriptionService = new SubscriptionsService(accessToken);
    const data = await subscriptionService.createSubscription();

    return NextResponse.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/microsoft/subscriptions error:", message);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
