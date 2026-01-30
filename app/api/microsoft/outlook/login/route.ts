import { NextResponse } from "next/server";
import { MicrosoftOutlookService } from "../outlook.service";
import { getErrorMessage } from "@/utils/handle-error";

export async function GET() {
  try {
    console.log("GET /api/microsoft/outlook/login");
    const outlookService = new MicrosoftOutlookService();
    const url = await outlookService.getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/microsoft/outlook/login error:", message);
    return NextResponse.json(
      { error: "Failed to get login URL" },
      { status: 500 },
    );
  }
}
