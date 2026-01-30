import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAccessToken } from "@/app/api/microsoft/auth";
import { SubscriptionsService } from "../subscriptions.service";
import { getErrorMessage } from "@/utils/handle-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log("DELETE /api/microsoft/subscriptions/[id]", id);

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    const subscriptionService = new SubscriptionsService(accessToken);
    await subscriptionService.deleteSubscription(id);

    return NextResponse.json({ data: true });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("DELETE /api/microsoft/subscriptions/[id] error:", message);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log("PATCH /api/microsoft/subscriptions/[id]", id);

    const { accessToken } = await getMicrosoftAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    const subscriptionService = new SubscriptionsService(accessToken);
    await subscriptionService.forceRenewSubscription(id);

    return NextResponse.json({ data: true });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("PATCH /api/microsoft/subscriptions/[id] error:", message);
    return NextResponse.json(
      { error: "Failed to renew subscription" },
      { status: 500 },
    );
  }
}
