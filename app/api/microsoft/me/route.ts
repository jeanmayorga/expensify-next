import { getErrorMessage } from "@/utils/handle-error";
import { MeService } from "./service";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";

export async function GET() {
  try {
    console.log("GET /api/microsoft/me");
    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new MeService(accessToken);
    const data = await service.getMe();

    return Response.json({ data });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/me error:", message);
    return Response.json({ error: "Failed to get me" }, { status: 500 });
  }
}
