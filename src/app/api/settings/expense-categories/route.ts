import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;

  const categories = await prisma.expenseCategory.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const body = await req.json();

  if (body.action === "CREATE") {
    const category = await prisma.expenseCategory.create({
      data: {
        organizationId: orgId,
        name: body.name,
        description: body.description || null,
      },
    });
    return NextResponse.json(category, { status: 201 });
  }

  if (body.action === "UPDATE") {
    const category = await prisma.expenseCategory.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(category);
  }

  if (body.action === "DELETE") {
    await prisma.expenseCategory.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
