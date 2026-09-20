import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  purchaseCost: z.coerce.number().min(0, "Purchase cost must be >= 0"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be >= 0"),
  minimumStock: z.coerce.number().min(0, "Minimum stock must be >= 0").default(0),
  reorderLevel: z.coerce.number().min(0, "Reorder level must be >= 0").default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  isTaxable: z.boolean().default(false),
  barcode: z.string().optional(),
  initialStock: z.coerce.number().min(0).default(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: any = { organizationId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        unit: { select: { name: true, abbreviation: true } },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: products });
  } catch (error: any) {
    console.error("GET products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const storeId = (session?.user as any)?.storeId;
    const userId = session?.user?.id;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProductSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = parsed.data;

    // Check SKU uniqueness
    const existing = await prisma.product.findFirst({
      where: {
        organizationId,
        sku: data.sku.trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A product with SKU "${data.sku}" already exists.` },
        { status: 409 }
      );
    }

    const product = await prisma.$transaction(async (tx) => {
      // 1. Create Product
      const newProduct = await tx.product.create({
        data: {
          organizationId,
          sku: data.sku.trim(),
          name: data.name.trim(),
          description: data.description?.trim() || null,
          categoryId: data.categoryId || null,
          brandId: data.brandId || null,
          unitId: data.unitId || null,
          purchaseCost: data.purchaseCost,
          sellingPrice: data.sellingPrice,
          minimumStock: data.minimumStock,
          reorderLevel: data.reorderLevel || data.minimumStock * 2,
          taxRate: data.taxRate,
          isTaxable: data.isTaxable || data.taxRate > 0,
          status: data.status,
          createdBy: userId,
        },
      });

      // 2. Add Barcode if provided
      if (data.barcode?.trim()) {
        await tx.productBarcode.create({
          data: {
            productId: newProduct.id,
            barcode: data.barcode.trim(),
            isPrimary: true,
          },
        });
      }

      // 3. Add Initial Stock if > 0 and store exists
      if (data.initialStock > 0 && storeId) {
        await tx.inventoryBalance.create({
          data: {
            storeId,
            productId: newProduct.id,
            quantity: data.initialStock,
            averageCost: data.purchaseCost,
          },
        });

        await tx.stockMovement.create({
          data: {
            storeId,
            productId: newProduct.id,
            type: "OPENING",
            quantity: data.initialStock,
            unitCost: data.purchaseCost,
            notes: "Initial opening stock upon product creation",
            createdBy: userId,
          },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          storeId: storeId || null,
          actorId: userId,
          action: "PRODUCT_CREATED",
          entityType: "PRODUCT",
          entityId: newProduct.id,
          newValues: {
            name: newProduct.name,
            sku: newProduct.sku,
            sellingPrice: Number(newProduct.sellingPrice),
            initialStock: data.initialStock,
          },
        },
      });

      return newProduct;
    });

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    console.error("POST product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
