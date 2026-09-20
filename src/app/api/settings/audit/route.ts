import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where: { organizationId: orgId } }),
  ]);

  const storeId = (session.user as any).storeId;
  const settings = storeId
    ? await prisma.storeSetting.findMany({ where: { storeId, key: { startsWith: "audit_" } } })
    : [];

  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    retentionDays: map["audit_retention_days"] || "365",
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  if (!storeId) return NextResponse.json({ error: "No store assigned" }, { status: 400 });

  const body = await req.json();

  if (body.retentionDays) {
    await prisma.storeSetting.upsert({
      where: { storeId_key: { storeId, key: "audit_retention_days" } },
      create: { storeId, key: "audit_retention_days", value: String(body.retentionDays) },
      update: { value: String(body.retentionDays) },
    });
  }

  return NextResponse.json({ success: true });
}
