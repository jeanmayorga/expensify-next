import { MicrosoftOutlookService } from "@/app/api/microsoft/outlook/outlook.service";
import { RedisService } from "@/app/api/redis/service";

export interface MicrosoftAuthResult {
  accessToken: string | null;
}

export async function getMicrosoftAccessToken(): Promise<MicrosoftAuthResult> {
  try {
    console.log("getMicrosoftAccessToken()");

    const redisService = new RedisService();
    const homeAccountId = await redisService.get("homeAccountId");
    if (!homeAccountId) {
      console.log("getMicrosoftAccessToken(): No homeAccountId available.");
      return { accessToken: null };
    }

    const outlookService = new MicrosoftOutlookService();
    const accessToken = await outlookService.getAccessToken(homeAccountId);
    if (!accessToken) {
      console.log("getMicrosoftAccessToken(): No accessToken available.");
      return { accessToken: null };
    }

    return { accessToken };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.log("getMicrosoftAccessToken()->error->", message);
    return { accessToken: null };
  }
}
