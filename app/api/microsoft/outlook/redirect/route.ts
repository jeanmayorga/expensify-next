import { NextRequest, NextResponse } from "next/server";
import { MicrosoftOutlookService } from "../outlook.service";
import { SubscriptionsService } from "../../subscriptions/subscriptions.service";
import { RedisService } from "@/app/api/redis/service";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/microsoft/outlook/redirect");
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code not provided" },
        { status: 400 },
      );
    }

    const outlookService = new MicrosoftOutlookService();
    const acquire = await outlookService.getAcquireTokenByCode(code);

    const accessTokenTmp = acquire.accessToken;
    const homeAccountId = acquire.homeAccountId;
    if (!homeAccountId) {
      return NextResponse.json(
        { error: "No home account ID found" },
        { status: 500 },
      );
    }

    const redisService = new RedisService();
    await redisService.set("homeAccountId", homeAccountId);

    const subscriptionService = new SubscriptionsService(accessTokenTmp);
    await subscriptionService.renewSubscription();

    return NextResponse.json({ homeAccountId, accessTokenTmp });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/outlook/redirect error:", message);
    return NextResponse.json(
      { error: "Failed to process redirect" },
      { status: 500 },
    );
  }
}
