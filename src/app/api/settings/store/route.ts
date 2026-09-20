import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const storeId = (session.user as any).storeId;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { currency: true, timezone: true, locale: true },
  });

  const store = storeId
    ? await prisma.store.findUnique({ where: { id: storeId } })
    : null;

  return NextResponse.json({ org, store });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const storeId = (session.user as any).storeId;
  const body = await req.json();

  if (body.currency || body.timezone || body.locale) {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(body.currency && { currency: body.currency }),
        ...(body.timezone && { timezone: body.timezone }),
        ...(body.locale && { locale: body.locale }),
      },
    });
  }

  if (storeId && (body.storeName || body.storeAddress || body.storePhone || body.storeEmail)) {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(body.storeName && { name: body.storeName }),
        ...(body.storeAddress !== undefined && { address: body.storeAddress }),
        ...(body.storePhone !== undefined && { phone: body.storePhone }),
        ...(body.storeEmail !== undefined && { email: body.storeEmail }),
      },
    });
  }

  return NextResponse.json({ success: true });
}
