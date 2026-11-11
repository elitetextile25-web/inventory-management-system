import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getProductCodePrefix, generateUniqueProductCode } from "@/lib/product-code";

const ProductCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  productType: z.string().default("FINISHED_PRODUCT"),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional().nullable(),
  shopId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  storageLocationId: z.string().optional().nullable(),

  // Colors & Attributes
  color: z.string().optional().nullable(),
  colorIds: z.array(z.string()).optional().default([]),

  // Measurements
  weight: z.coerce.number().min(0).optional().nullable(),
  weightUnit: z.string().optional().nullable(),
  lengthInMeters: z.coerce.number().min(0).optional().nullable(),

  // Pricing & Discounts
  purchaseCost: z.coerce.number().min(0, "Buying price cannot be negative"),
  sellingPrice: z.coerce.number().min(0, "Regular selling price cannot be negative"),
  discountType: z.enum(["NONE", "FIXED", "PERCENTAGE"]).default("NONE"),
  discountValue: z.coerce.number().min(0, "Discount value cannot be negative").default(0),

  // Inventory & Stock
  initialStock: z.coerce.number().min(0).default(0),
  minimumStock: z.coerce.number().min(0).default(10),
  maximumStock: z.coerce.number().min(0).optional().nullable(),
  reorderLevel: z.coerce.number().min(0).optional().nullable(),
  rackNumber: z.string().optional().nullable(),
  shelfNumber: z.string().optional().nullable(),

  // Tax & Barcodes
  taxRate: z.coerce.number().min(0).max(100).default(0),
  isTaxable: z.boolean().default(false),
  barcode: z.string().optional().nullable(),

  // Media
  imageUrl: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional().default([]),

  // Suppliers
  supplierId: z.string().optional().nullable(),
  purchaseReference: z.string().optional().nullable(),
  suppliers: z
    .array(
      z.object({
        supplierId: z.string(),
        purchaseReference: z.string().optional().nullable(),
        supplierSku: z.string().optional().nullable(),
        isDefault: z.boolean().default(false),
      })
    )
    .optional(),

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
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId");
    const productType = searchParams.get("productType");
    const color = searchParams.get("color");
    const unitId = searchParams.get("unitId");
    const status = searchParams.get("status");
    const storageLocationId = searchParams.get("storageLocationId");
    const supplierId = searchParams.get("supplierId");
    const stockStatus = searchParams.get("stockStatus"); // IN_STOCK, LOW_STOCK, OUT_OF_STOCK

    const where: any = { organizationId };

    if (categoryId && categoryId !== "ALL") where.categoryId = categoryId;
    if (subcategoryId && subcategoryId !== "ALL") where.subcategoryId = subcategoryId;
    if (productType && productType !== "ALL") where.productType = productType;
    if (color && color !== "ALL") {
      where.OR = [
        { color: { equals: color, mode: "insensitive" } },
        { colors: { some: { color: { name: { equals: color, mode: "insensitive" } } } } },
      ];
    }
    if (unitId && unitId !== "ALL") where.unitId = unitId;
    if (status && status !== "ALL") where.status = status;
    if (storageLocationId && storageLocationId !== "ALL") {
      where.OR = [
        { storageLocationId },
        { storageBalances: { some: { storageLocationId } } },
      ];
    }
    if (supplierId && supplierId !== "ALL") {
      where.supplierProducts = { some: { supplierId } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcodes: { some: { barcode: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        storageLocation: { select: { id: true, name: true, code: true, type: true } },
        images: { orderBy: { isPrimary: "desc" } },
        colors: { include: { color: true } },
        barcodes: { take: 2 },
        inventoryBalances: {
          include: { store: { select: { id: true, name: true } } },
        },
        storageBalances: {
          include: { storageLocation: { select: { id: true, name: true, code: true } } },
        },
        supplierProducts: {
          include: { supplier: { select: { id: true, name: true, company: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Client-side stockStatus filter if requested
    let filteredProducts = products;
    if (stockStatus && stockStatus !== "ALL") {
      filteredProducts = products.filter((p) => {
        const totalStock = p.inventoryBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
        const minStock = Number(p.minimumStock);
        if (stockStatus === "OUT_OF_STOCK") return totalStock <= 0;
        if (stockStatus === "LOW_STOCK") return totalStock > 0 && totalStock <= minStock;
        if (stockStatus === "IN_STOCK") return totalStock > minStock;
        return true;
      });
    }

    return NextResponse.json({ data: filteredProducts, total: filteredProducts.length });
  } catch (error: any) {
    console.error("GET products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    let storeId = (session?.user as any)?.storeId;
    const userId = session?.user?.id;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!storeId) {
      const defaultStore = await prisma.store.findFirst({
        where: { organizationId, isActive: true },
        select: { id: true },
      });
      storeId = defaultStore?.id;
    }

    const body = await req.json();
    const parsed = ProductCreateSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = parsed.data;

    // Validate pricing calculations
    let finalSellingPrice = data.sellingPrice;
    if (data.discountType === "PERCENTAGE") {
      if (data.discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        );
      }
      finalSellingPrice = Math.max(0, data.sellingPrice - (data.sellingPrice * data.discountValue) / 100);
    } else if (data.discountType === "FIXED") {
      if (data.discountValue > data.sellingPrice) {
        return NextResponse.json(
          { error: "Fixed discount amount cannot exceed regular selling price" },
          { status: 400 }
        );
      }
      finalSellingPrice = Math.max(0, data.sellingPrice - data.discountValue);
    }

    // Verify category
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, organizationId },
    });
    if (!category) {
      return NextResponse.json({ error: "Selected category not found" }, { status: 400 });
    }

    // Verify subcategory if provided
    if (data.subcategoryId) {
      const sub = await prisma.category.findFirst({
        where: { id: data.subcategoryId, organizationId },
      });
      if (!sub || sub.parentId !== data.categoryId) {
        return NextResponse.json(
          { error: "Subcategory does not belong to the selected category" },
          { status: 400 }
        );
      }
    }

    const createdProduct = await prisma.$transaction(async (tx) => {
      // 1. Generate atomic unique product code
      const prefix = getProductCodePrefix(data.productType, category.name);
      const productCode = await generateUniqueProductCode(tx, organizationId, prefix);
      const sku = data.sku?.trim() || productCode;

      // 2. Create Product
      const newProduct = await tx.product.create({
        data: {
          organizationId,
          productCode,
          sku,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || null,
          shopId: data.shopId || null,
          brandId: data.brandId || null,
          unitId: data.unitId || null,
          storageLocationId: data.storageLocationId || null,
          productType: data.productType,
          color: data.color?.trim() || null,

          // Pricing & Discount
          purchaseCost: data.purchaseCost,
          sellingPrice: data.sellingPrice,
          discountType: data.discountType,
          discountValue: data.discountValue,
          finalSellingPrice,

          // Measurements & Specs
          weight: data.weight || null,
          weightUnit: data.weightUnit || null,
          lengthInMeters: data.lengthInMeters || null,
          minimumStock: data.minimumStock,
          maximumStock: data.maximumStock || null,
          reorderLevel: data.reorderLevel || data.minimumStock * 2,
          rackNumber: data.rackNumber?.trim() || null,
          shelfNumber: data.shelfNumber?.trim() || null,

          taxRate: data.taxRate,
          isTaxable: data.isTaxable || data.taxRate > 0,
          imageUrl: data.imageUrl || data.imageUrls[0] || null,
          status: data.status,
          createdBy: userId,
        },
      });

      // 3. Save Multiple Product Images
      const allImages = Array.from(
        new Set([data.imageUrl, ...(data.imageUrls || [])].filter(Boolean) as string[])
      );
      if (allImages.length > 0) {
        await tx.productImage.createMany({
          data: allImages.map((url, index) => ({
            productId: newProduct.id,
            url,
            isPrimary: index === 0,
            order: index,
          })),
        });
      }

      // 4. Save Colors
      if (data.colorIds && data.colorIds.length > 0) {
        await tx.productColorMap.createMany({
          data: data.colorIds.map((cId) => ({
            productId: newProduct.id,
            colorId: cId,
          })),
        });
      }

      // 5. Save Suppliers
      const supplierList = [...(data.suppliers || [])];
      if (data.supplierId && !supplierList.some((s) => s.supplierId === data.supplierId)) {
        supplierList.push({
          supplierId: data.supplierId,
          purchaseReference: data.purchaseReference || null,
          supplierSku: null,
          isDefault: true,
        });
      }

      if (supplierList.length > 0) {
        for (const sup of supplierList) {
          await tx.supplierProduct.upsert({
            where: {
              supplierId_productId: {
                supplierId: sup.supplierId,
                productId: newProduct.id,
              },
            },
            create: {
              productId: newProduct.id,
              supplierId: sup.supplierId,
              purchaseReference: sup.purchaseReference || null,
              supplierSku: sup.supplierSku || null,
              isDefault: sup.isDefault || false,
            },
            update: {
              purchaseReference: sup.purchaseReference || null,
              supplierSku: sup.supplierSku || null,
              isDefault: sup.isDefault || false,
            },
          });
        }
      }

      // 6. Barcode
      if (data.barcode?.trim()) {
        await tx.productBarcode.create({
          data: {
            productId: newProduct.id,
            barcode: data.barcode.trim(),
            isPrimary: true,
          },
        });
      }

      // 7. Initial Opening Stock
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
            notes: `Initial opening stock (${productCode})`,
            createdBy: userId,
          },
        });

        // Also record storage location balance if selected
        if (data.storageLocationId) {
          await tx.storageInventoryBalance.create({
            data: {
              storageLocationId: data.storageLocationId,
              productId: newProduct.id,
              quantity: data.initialStock,
              averageCost: data.purchaseCost,
            },
          });

          await tx.storageStockMovement.create({
            data: {
              storageLocationId: data.storageLocationId,
              productId: newProduct.id,
              type: "OPENING",
              quantity: data.initialStock,
              unitCost: data.purchaseCost,
              notes: `Initial opening stock (${productCode})`,
              createdBy: userId,
            },
          });
        }
      }

      // 8. Audit Log
      try {
        await tx.auditLog.create({
          data: {
            organizationId,
            storeId: storeId || null,
            actorId: userId,
            action: "PRODUCT_CREATED",
            entityType: "PRODUCT",
            entityId: newProduct.id,
            newValues: {
              productCode: newProduct.productCode,
              name: newProduct.name,
              sku: newProduct.sku,
              productType: newProduct.productType,
              purchaseCost: Number(newProduct.purchaseCost),
              sellingPrice: Number(newProduct.sellingPrice),
              finalSellingPrice: Number(newProduct.finalSellingPrice),
              initialStock: data.initialStock,
            },
          },
        });
      } catch (auditErr) {
        console.warn("Audit log creation skipped:", auditErr);
      }

      return newProduct;
    });

    return NextResponse.json({
      success: true,
      message: `Product ${createdProduct.productCode} created successfully`,
      product: createdProduct,
    });
  } catch (error: any) {
    console.error("POST product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
