import { NextRequest, NextResponse } from "next/server";
import { SubscriptionsRepository } from "@/app/api/subscriptions/repository";
import { SubscriptionInsert } from "@/app/api/subscriptions/model";

export async function GET() {
  try {
    const repo = new SubscriptionsRepository();
    const subscriptions = await repo.getAll();
    return NextResponse.json({ data: subscriptions });
  } catch (error) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to get subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscriptionInsert = await request.json();
    const repo = new SubscriptionsRepository();
    const subscription = await repo.create(body);
    return NextResponse.json({ data: subscription });
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
