import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  return NextResponse.json(org);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const body = await req.json();
  const { name, address, phone, email, website, taxNumber } = body;

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: { name, address, phone, email, website, taxNumber },
  });

  return NextResponse.json(org);
}
