import { NextRequest, NextResponse } from "next/server";
import { BanksRepository } from "@/app/api/banks/repository";
import { BankInsert } from "@/app/api/banks/model";

export async function GET() {
  try {
    const banksRepository = new BanksRepository();
    const banks = await banksRepository.getAll();

    return NextResponse.json({ data: banks });
  } catch (error) {
    console.error("GET /api/banks error:", error);
    return NextResponse.json({ error: "Failed to get banks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BankInsert = await request.json();

    const banksRepository = new BanksRepository();
    const bank = await banksRepository.create(body);

    return NextResponse.json({ data: bank });
  } catch (error) {
    console.error("POST /api/banks error:", error);
    return NextResponse.json(
      { error: "Failed to create bank" },
      { status: 500 },
    );
  }
}
