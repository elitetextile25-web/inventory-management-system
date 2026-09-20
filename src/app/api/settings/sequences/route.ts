import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;

  const sequences = await prisma.documentSequence.findMany({
    where: { organizationId: orgId },
    orderBy: { type: "asc" },
  });

  return NextResponse.json({ sequences });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const body = await req.json();

  if (body.action === "UPSERT") {
    const seq = await prisma.documentSequence.upsert({
      where: {
        organizationId_storeId_type: {
          organizationId: orgId,
          storeId: body.storeId || null,
          type: body.type,
        },
      },
      create: {
        organizationId: orgId,
        storeId: body.storeId || null,
        type: body.type,
        prefix: body.prefix,
        padding: body.padding || 6,
      },
      update: {
        prefix: body.prefix,
        padding: body.padding,
      },
    });
    return NextResponse.json(seq);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
