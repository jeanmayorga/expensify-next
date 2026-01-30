import { MeService } from "./service";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";

export async function GET() {
  try {
    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = new MeService(accessToken);
    const data = await service.getMe();

    return Response.json({ data });
  } catch (error: unknown) {
    console.error("Failed to get microsoft me", error);
    return Response.json(
      { error: "Failed to get microsoft me" },
      { status: 500 },
    );
  }
}
