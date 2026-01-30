import { NextResponse } from "next/server";
import { MicrosoftService } from "../service";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET() {
  try {
    console.log("GET /api/microsoft/login");
    const microsoftService = new MicrosoftService();
    const url = await microsoftService.getAuthUrl();

    return NextResponse.redirect(url);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/login error:", message);
    return NextResponse.json(
      { error: "Failed to get login URL" },
      { status: 500 },
    );
  }
}
