import { NextRequest, NextResponse } from "next/server";
import { TransactionsService } from "../service";
import { getErrorMessage } from "@/utils/handle-error";
import { fromZonedTime } from "date-fns-tz";
import { endOfMonth, startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateString = searchParams.get("date");

    if (!dateString) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const timeZone = "America/Guayaquil";
    const startDate = startOfMonth(dateString);
    const endDate = endOfMonth(dateString);
    const startDateFromZonedTime = fromZonedTime(startDate, timeZone);
    const endDateFromZonedTime = fromZonedTime(endDate, timeZone);

    const transactionsService = new TransactionsService();
    const data = await transactionsService.getSummaryBetweenDates({
      startDate: startDateFromZonedTime,
      endDate: endDateFromZonedTime,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("GET /api/transactions/summary error:", message);
    return NextResponse.json(
      {
        data: {},
        totalExpenses: 0,
        totalIncomes: 0,
        totalAmount: 0,
        error: message,
      },
      { status: 500 },
    );
  }
}
