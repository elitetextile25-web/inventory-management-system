import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { organizationId },
      include: {
        category: true,
        brand: true,
        unit: true,
        inventoryBalances: true,
      },
      orderBy: { name: "asc" },
    });

    const rows = products.map((p) => {
      const totalStock = p.inventoryBalances.reduce(
        (sum, b) => sum + Number(b.quantity),
        0
      );
      const cost = Number(p.purchaseCost);
      const price = Number(p.sellingPrice);
      const margin =
        cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) + "%" : "N/A";

      return {
        SKU: p.sku,
        "Fabric / Product Name": p.name,
        Category: p.category?.name || "General",
        "Brand / Mill": p.brand?.name || "Standard",
        Unit: p.unit?.abbreviation || "meter",
        "Purchase Cost (৳)": cost,
        "Selling Price (৳)": price,
        "Margin %": margin,
        "Current Stock": totalStock,
        "Min Stock Alert": Number(p.minimumStock),
        Status: p.status,
        Description: p.description || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fabrics Catalog");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="FabricPro_Catalog.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Product export error:", error);
    return NextResponse.json(
      { error: "Failed to export catalog" },
      { status: 500 }
    );
  }
}
