import { NextRequest, NextResponse } from "next/server";
import { MicrosoftService } from "../service";
import { SubscriptionsService } from "../subscriptions/service";
import { RedisService } from "@/app/api/redis/service";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    console.log("GET /api/microsoft/redirect", code);

    if (!code) {
      return NextResponse.json({ error: "No code provided." }, { status: 400 });
    }

    const microsoftService = new MicrosoftService();
    const acquire = await microsoftService.getAcquireTokenByCode(code);

    const accessTokenTmp = acquire.accessToken;
    const homeAccountId = acquire.homeAccountId;
    if (!homeAccountId) {
      return NextResponse.json(
        { error: "No homeAccountId found." },
        { status: 500 },
      );
    }

    const redisService = new RedisService();
    await redisService.set("homeAccountId", homeAccountId);

    const subscriptionService = new SubscriptionsService(accessTokenTmp);
    await subscriptionService.renewSubscription();

    return NextResponse.json({ data: { homeAccountId, accessTokenTmp } });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/redirect error:", message);
    return NextResponse.json(
      { error: "Failed to process redirect" },
      { status: 500 },
    );
  }
}
