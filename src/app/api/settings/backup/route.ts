import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const settings = storeId
    ? await prisma.storeSetting.findMany({ where: { storeId, key: { startsWith: "backup_" } } })
    : [];

  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  return NextResponse.json({
    autoBackup: map["backup_auto"] === "true",
    frequency: map["backup_frequency"] || "daily",
    retentionDays: map["backup_retention_days"] || "30",
    lastBackup: map["backup_last_at"] || null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  if (!storeId) return NextResponse.json({ error: "No store assigned" }, { status: 400 });

  const body = await req.json();
  const pairs: Record<string, string> = {
    backup_auto: String(!!body.autoBackup),
    backup_frequency: body.frequency || "daily",
    backup_retention_days: String(body.retentionDays || 30),
  };

  for (const [key, value] of Object.entries(pairs)) {
    await prisma.storeSetting.upsert({
      where: { storeId_key: { storeId, key } },
      create: { storeId, key, value },
      update: { value },
    });
  }

  return NextResponse.json({ success: true });
}
