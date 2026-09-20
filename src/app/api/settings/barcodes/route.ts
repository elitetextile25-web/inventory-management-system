import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const settings = storeId
    ? await prisma.storeSetting.findMany({ where: { storeId, key: { startsWith: "barcode_" } } })
    : [];

  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  return NextResponse.json({
    barcodeType: map["barcode_type"] || "EAN13",
    labelWidth: map["barcode_label_width"] || "50",
    labelHeight: map["barcode_label_height"] || "25",
    showPrice: map["barcode_show_price"] !== "false",
    showName: map["barcode_show_name"] !== "false",
    showSku: map["barcode_show_sku"] !== "false",
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  if (!storeId) return NextResponse.json({ error: "No store assigned" }, { status: 400 });

  const body = await req.json();
  const pairs: Record<string, string> = {
    barcode_type: body.barcodeType || "EAN13",
    barcode_label_width: String(body.labelWidth || 50),
    barcode_label_height: String(body.labelHeight || 25),
    barcode_show_price: String(body.showPrice !== false),
    barcode_show_name: String(body.showName !== false),
    barcode_show_sku: String(body.showSku !== false),
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
