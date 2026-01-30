import { NextRequest, NextResponse } from "next/server";
import { BanksRepository } from "@/app/api/banks/repository";
import { BankUpdate } from "@/app/api/banks/model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const banksRepository = new BanksRepository();
    const bank = await banksRepository.getById(id);

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    return NextResponse.json({ data: bank });
  } catch (error) {
    console.error("GET /api/banks/[id] error:", error);
    return NextResponse.json({ error: "Failed to get bank" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const body: BankUpdate = await request.json();

    const banksRepository = new BanksRepository();
    const bank = await banksRepository.update(id, body);

    return NextResponse.json({ data: bank });
  } catch (error) {
    console.error("PATCH /api/banks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update bank" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const banksRepository = new BanksRepository();
    await banksRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/banks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete bank" },
      { status: 500 },
    );
  }
}
