import { NextRequest, NextResponse } from "next/server";
import { TransactionsService } from "@/app/api/transactions/service";
import { TransactionInsert } from "@/app/api/transactions/model";
import { getErrorMessage } from "@/utils/handle-error";
import { fromZonedTime } from "date-fns-tz";
import { endOfDay, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateString = searchParams.get("date");
    const type = searchParams.get("type");

    if (!dateString) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const timeZone = "America/Guayaquil";
    const startDate = startOfDay(dateString);
    const endDate = endOfDay(dateString);
    const startDateFromZonedTime = fromZonedTime(startDate, timeZone);
    const endDateFromZonedTime = fromZonedTime(endDate, timeZone);

    const transactionsService = new TransactionsService();
    const data = await transactionsService.getTxsBetweenDates({
      startDate: startDateFromZonedTime,
      endDate: endDateFromZonedTime,
      type: type || "all",
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/transactions error:", message);
    return NextResponse.json({ data: [], error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionInsert = await request.json();

    const transactionsService = new TransactionsService();
    const transaction = await transactionsService.create(body);

    return NextResponse.json({ data: transaction });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("POST /api/transactions error:", message);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
