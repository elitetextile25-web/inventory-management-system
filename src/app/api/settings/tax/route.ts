import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const storeId = (session.user as any).storeId;

  // Tax settings stored as StoreSetting key-value pairs
  const settings = storeId
    ? await prisma.storeSetting.findMany({ where: { storeId, key: { startsWith: "tax_" } } })
    : [];

  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  return NextResponse.json({
    taxEnabled: settingsMap["tax_enabled"] === "true",
    taxName: settingsMap["tax_name"] || "VAT",
    taxRate: settingsMap["tax_rate"] || "0",
    taxNumber: settingsMap["tax_number"] || "",
    taxInclusive: settingsMap["tax_inclusive"] === "true",
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  if (!storeId) return NextResponse.json({ error: "No store assigned" }, { status: 400 });

  const body = await req.json();
  const pairs: Record<string, string> = {
    tax_enabled: String(!!body.taxEnabled),
    tax_name: body.taxName || "VAT",
    tax_rate: String(body.taxRate || 0),
    tax_number: body.taxNumber || "",
    tax_inclusive: String(!!body.taxInclusive),
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
