import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  if (!storeId) return NextResponse.json({ accounts: [] });

  const accounts = await prisma.cashAccount.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  if (!storeId) return NextResponse.json({ error: "No store assigned" }, { status: 400 });

  const body = await req.json();

  if (body.action === "CREATE") {
    const account = await prisma.cashAccount.create({
      data: {
        storeId,
        name: body.name,
        type: body.type || "CASH",
        openingBalance: body.openingBalance || 0,
        currentBalance: body.openingBalance || 0,
        isDefault: body.isDefault || false,
      },
    });
    return NextResponse.json(account, { status: 201 });
  }

  if (body.action === "UPDATE") {
    const account = await prisma.cashAccount.update({
      where: { id: body.id },
      data: {
        name: body.name,
        type: body.type,
        isActive: body.isActive,
        isDefault: body.isDefault,
      },
    });
    return NextResponse.json(account);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
