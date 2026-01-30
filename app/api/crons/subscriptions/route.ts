import { NextResponse } from "next/server";
import { RedisService } from "@/app/api/redis/service";
import { MicrosoftService } from "@/app/api/microsoft/service";
import { SubscriptionsService } from "@/app/api/microsoft/subscriptions/service";

export async function GET() {
  try {
    console.log("⏱️ Cron: GET /api/crons/subscriptions");
    const redisService = new RedisService();
    const homeAccountId = await redisService.get("homeAccountId");

    if (!homeAccountId) {
      console.log("No homeAccountId found.");
      return NextResponse.json(
        { error: "No homeAccountId found." },
        { status: 401 },
      );
    }

    const microsoftService = new MicrosoftService();
    const accessToken = await microsoftService.getAccessToken(homeAccountId);

    if (!accessToken) {
      console.log("No access token available.");
      return NextResponse.json(
        { error: "No access token available." },
        { status: 401 },
      );
    }

    const subscriptionService = new SubscriptionsService(accessToken);
    await subscriptionService.renewSubscription();

    console.log("Renewal completed");
    return NextResponse.json({
      success: true,
      message: "Subscription renewal completed",
    });
  } catch (error) {
    console.error("Failed to renew subscription:", error);
    return NextResponse.json(
      { error: "Failed to renew subscription" },
      { status: 500 },
    );
  }
}
