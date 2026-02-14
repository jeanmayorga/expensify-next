import { NextRequest, NextResponse } from "next/server";
import { SubscriptionsRepository } from "@/app/api/subscriptions/repository";
import { SubscriptionUpdate } from "@/app/api/subscriptions/model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repo = new SubscriptionsRepository();
    const subscription = await repo.getById(id);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: subscription });
  } catch (error) {
    console.error("GET /api/subscriptions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: SubscriptionUpdate = await request.json();
    const repo = new SubscriptionsRepository();
    const subscription = await repo.update(id, body);
    return NextResponse.json({ data: subscription });
  } catch (error) {
    console.error("PATCH /api/subscriptions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const repo = new SubscriptionsRepository();
    const success = await repo.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/subscriptions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 },
    );
  }
}
