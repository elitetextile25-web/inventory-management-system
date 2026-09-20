import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateGoogleSheetsWorkbook, GoogleSheetsSyncPayload } from "@/lib/google-sheets";

export async function GET() {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const storeId = (session?.user as any)?.storeId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch settings for this store
    let webhookUrl = "";
    let autoSync = false;
    let lastSyncedAt = "";

    if (storeId) {
      const settings = await prisma.storeSetting.findMany({
        where: {
          storeId,
          key: { in: ["google_sheets_webhook_url", "google_sheets_auto_sync", "google_sheets_last_synced_at"] },
        },
      });

      for (const s of settings) {
        if (s.key === "google_sheets_webhook_url") webhookUrl = s.value;
        if (s.key === "google_sheets_auto_sync") autoSync = s.value === "true";
        if (s.key === "google_sheets_last_synced_at") lastSyncedAt = s.value;
      }
    }

    // Counts for overview
    const [fabricsCount, salesCount, customersCount, suppliersCount] = await Promise.all([
      prisma.product.count({ where: { organizationId } }),
      prisma.sales.count({ where: storeId ? { storeId } : {} }),
      prisma.customer.count({ where: { organizationId } }),
      prisma.supplier.count({ where: { organizationId } }),
    ]);

    return NextResponse.json({
      connected: Boolean(webhookUrl && webhookUrl.startsWith("http")),
      webhookUrl,
      autoSync,
      lastSyncedAt,
      counts: {
        fabrics: fabricsCount,
        sales: salesCount,
        customers: customersCount,
        suppliers: suppliersCount,
      },
    });
  } catch (error: any) {
    console.error("GET google-sheets settings error:", error);
    return NextResponse.json({ error: "Failed to fetch Google Sheets settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const storeId = (session?.user as any)?.storeId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. SAVE CONFIGURATION
    if (action === "SAVE_CONFIG") {
      const { webhookUrl, autoSync } = body;
      if (!storeId) {
        return NextResponse.json({ error: "Store not identified" }, { status: 400 });
      }

      await prisma.storeSetting.upsert({
        where: { storeId_key: { storeId, key: "google_sheets_webhook_url" } },
        update: { value: webhookUrl || "" },
        create: { storeId, key: "google_sheets_webhook_url", value: webhookUrl || "" },
      });

      await prisma.storeSetting.upsert({
        where: { storeId_key: { storeId, key: "google_sheets_auto_sync" } },
        update: { value: autoSync ? "true" : "false" },
        create: { storeId, key: "google_sheets_auto_sync", value: autoSync ? "true" : "false" },
      });

      return NextResponse.json({ success: true, message: "Google Sheets settings saved successfully!" });
    }

    // 2. EXPORT EXCEL WORKBOOK (Google Sheets Compatible)
    if (action === "EXPORT_XLSX") {
      const payload = await buildSyncPayload(organizationId, storeId);
      const buffer = generateGoogleSheetsWorkbook(payload);

      return new Response(buffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="FabricPro_GoogleSheets_Storage.xlsx"',
        },
      });
    }

    // 3. PUSH / SYNC ALL TO GOOGLE SHEET WEBHOOK
    if (action === "SYNC_NOW") {
      let targetUrl = body.webhookUrl;
      if (!targetUrl && storeId) {
        const setting = await prisma.storeSetting.findUnique({
          where: { storeId_key: { storeId, key: "google_sheets_webhook_url" } },
        });
        targetUrl = setting?.value;
      }

      if (!targetUrl || !targetUrl.startsWith("http")) {
        return NextResponse.json({
          error: "Please enter your Google Apps Script Web App URL first",
        }, { status: 400 });
      }

      const payload = await buildSyncPayload(organizationId, storeId);

      // Send POST to Google Apps Script Web App
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script handles text/plain without CORS preflight issues
        body: JSON.stringify({ action: "SYNC_ALL", ...payload }),
      });

      const responseText = await res.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!res.ok || responseData.status === "error") {
        return NextResponse.json({
          error: responseData.message || "Google Sheets returned an error during synchronization",
        }, { status: 502 });
      }

      // Record last sync timestamp
      const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
      if (storeId) {
        await prisma.storeSetting.upsert({
          where: { storeId_key: { storeId, key: "google_sheets_last_synced_at" } },
          update: { value: now },
          create: { storeId, key: "google_sheets_last_synced_at", value: now },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${payload.fabrics.length} fabrics and ${payload.sales.length} sales to Google Sheets!`,
        syncedAt: now,
      });
    }

    // 4. IMPORT / PULL FABRICS FROM GOOGLE SHEET
    if (action === "IMPORT_FABRICS") {
      let targetUrl = body.webhookUrl;
      if (!targetUrl && storeId) {
        const setting = await prisma.storeSetting.findUnique({
          where: { storeId_key: { storeId, key: "google_sheets_webhook_url" } },
        });
        targetUrl = setting?.value;
      }

      if (!targetUrl || !targetUrl.startsWith("http")) {
        return NextResponse.json({
          error: "Google Sheets Webhook URL is not configured",
        }, { status: 400 });
      }

      const res = await fetch(targetUrl, { method: "GET" });
      const json = await res.json();

      if (!json.fabrics || !Array.isArray(json.fabrics)) {
        return NextResponse.json({
          error: "No fabric rows found in Google Sheet or sheet format is invalid",
        }, { status: 400 });
      }

      let importedCount = 0;
      for (const item of json.fabrics) {
        if (!item.sku || !item.name) continue;

        const existing = await prisma.product.findFirst({
          where: { organizationId, sku: item.sku },
        });

        if (!existing) {
          await prisma.product.create({
            data: {
              organizationId,
              sku: item.sku,
              name: item.name,
              purchaseCost: Number(item.purchaseCost) || 0,
              sellingPrice: Number(item.sellingPrice) || 0,
              minimumStock: Number(item.minimumStock) || 10,
              description: item.description || "Imported from Google Sheets",
              status: "ACTIVE",
            },
          });
          importedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Imported ${importedCount} new fabrics from Google Sheet into catalog.`,
        importedCount,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST google-sheets error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

/**
 * Builds the data payload containing fabrics, stock balances, sales, customers, and mills.
 */
async function buildSyncPayload(organizationId: string, storeId?: string): Promise<GoogleSheetsSyncPayload> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });

  const [products, balances, sales, customers, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        unit: { select: { abbreviation: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryBalance.findMany({
      where: storeId ? { storeId } : { product: { organizationId } },
      include: {
        product: { select: { sku: true, name: true } },
        store: { select: { name: true } },
      },
    }),
    prisma.sales.findMany({
      where: storeId ? { storeId } : { store: { organizationId } },
      include: {
        customer: { select: { name: true } },
      },
      take: 100,
      orderBy: { saleDate: "desc" },
    }),
    prisma.customer.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    organizationName: org?.name || "Fabric Store",
    syncedAt: new Date().toISOString(),
    fabrics: products.map((p) => {
      const cost = Number(p.purchaseCost);
      const price = Number(p.sellingPrice);
      const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) + "%" : "0%";
      return {
        sku: p.sku,
        name: p.name,
        category: p.category?.name || "Uncategorized",
        mill: p.brand?.name || "General Mill",
        unit: p.unit?.abbreviation || "m",
        purchaseCost: cost,
        sellingPrice: price,
        marginPercent: margin,
        minimumStock: Number(p.minimumStock),
        description: p.description || "",
      };
    }),
    stock: balances.map((b) => {
      const qty = Number(b.quantity);
      const avg = Number(b.averageCost);
      return {
        sku: b.product.sku,
        fabricName: b.product.name,
        storeName: b.store.name,
        quantityMeters: qty,
        averageCost: avg,
        totalValue: parseFloat((qty * avg).toFixed(2)),
      };
    }),
    sales: sales.map((s) => ({
      invoiceNumber: s.invoiceNumber,
      saleDate: s.saleDate.toISOString().split("T")[0],
      customer: s.customer?.name || "Walk-in Retail Buyer",
      channel: s.channel,
      subtotal: Number(s.subtotal),
      discount: Number(s.discountAmount),
      grandTotal: Number(s.grandTotal),
      paidAmount: Number(s.paidAmount),
      status: s.status,
    })),
    customers: customers.map((c) => ({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      creditLimit: Number(c.creditLimit),
    })),
    suppliers: suppliers.map((sp) => ({
      name: sp.name,
      phone: sp.phone || "",
      email: sp.email || "",
      address: sp.address || "",
      paymentTerms: sp.paymentTerms,
    })),
  };
}
