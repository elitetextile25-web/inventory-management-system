import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const { id } = await params;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        subcategory: true,
        shop: {
          include: {
            area: {
              include: {
                district: {
                  include: {
                    division: {
                      include: { country: true },
                    },
                  },
                },
              },
            },
          },
        },
        brand: true,
        unit: true,
        barcodes: true,
        storageLocation: { select: { id: true, name: true, code: true, type: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        colors: { include: { color: true } },
        supplierProducts: {
          include: {
            supplier: {
              select: { id: true, name: true, company: true, phone: true, email: true },
            },
          },
        },
        inventoryBalances: {
          include: { store: true },
        },
        storageBalances: {
          include: {
            storageLocation: {
              select: { id: true, name: true, code: true, type: true },
            },
          },
        },
        stockMovements: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        purchaseItems: {
          take: 10,
          include: {
            purchaseOrder: {
              select: {
                id: true,
                orderNumber: true,
                orderDate: true,
                status: true,
                supplier: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { purchaseOrder: { orderDate: "desc" } },
        },
        saleItems: {
          take: 10,
          include: {
            sale: {
              select: {
                id: true,
                invoiceNumber: true,
                saleDate: true,
                status: true,
              },
            },
          },
          orderBy: { sale: { saleDate: "desc" } },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error: any) {
    console.error("GET product [id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const userId = session?.user?.id;
    const { id } = await params;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();

    // Validate shop if provided
    if (body.shopId) {
      const shop = await prisma.shop.findFirst({
        where: { id: body.shopId, organizationId },
      });
      if (!shop) {
        return NextResponse.json({ error: "Selected shop not found" }, { status: 400 });
      }
    }

    // Validate category & subcategory if provided
    const targetCategoryId = body.categoryId !== undefined ? body.categoryId : existing.categoryId;
    if (body.subcategoryId) {
      const sub = await prisma.category.findFirst({
        where: { id: body.subcategoryId, organizationId },
      });
      if (!sub) {
        return NextResponse.json({ error: "Selected subcategory not found" }, { status: 400 });
      }
      if (targetCategoryId && sub.parentId !== targetCategoryId) {
        return NextResponse.json(
          { error: "Subcategory does not belong to the selected category" },
          { status: 400 }
        );
      }
    }

    // Price & Discount Calculations
    const purchaseCost =
      body.purchaseCost !== undefined ? Number(body.purchaseCost) : Number(existing.purchaseCost);
    const sellingPrice =
      body.sellingPrice !== undefined ? Number(body.sellingPrice) : Number(existing.sellingPrice);
    const discountType = body.discountType !== undefined ? body.discountType : existing.discountType;
    const discountValue =
      body.discountValue !== undefined ? Number(body.discountValue) : Number(existing.discountValue);

    if (purchaseCost < 0 || sellingPrice < 0 || discountValue < 0) {
      return NextResponse.json(
        { error: "Pricing and discount values cannot be negative" },
        { status: 400 }
      );
    }

    let finalSellingPrice = sellingPrice;
    if (discountType === "PERCENTAGE") {
      if (discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        );
      }
      finalSellingPrice = Math.max(0, sellingPrice - (sellingPrice * discountValue) / 100);
    } else if (discountType === "FIXED") {
      if (discountValue > sellingPrice) {
        return NextResponse.json(
          { error: "Fixed discount amount cannot exceed selling price" },
          { status: 400 }
        );
      }
      finalSellingPrice = Math.max(0, sellingPrice - discountValue);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update core product details (productCode is intentionally excluded so it never changes)
      const prod = await tx.product.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name.trim() : undefined,
          sku: body.sku !== undefined ? body.sku.trim() : undefined,
          productType: body.productType !== undefined ? body.productType : undefined,
          description: body.description !== undefined ? body.description.trim() : undefined,
          categoryId: body.categoryId !== undefined ? body.categoryId || null : undefined,
          subcategoryId: body.subcategoryId !== undefined ? body.subcategoryId || null : undefined,
          shopId: body.shopId !== undefined ? body.shopId || null : undefined,
          brandId: body.brandId !== undefined ? body.brandId || null : undefined,
          unitId: body.unitId !== undefined ? body.unitId || null : undefined,
          storageLocationId:
            body.storageLocationId !== undefined ? body.storageLocationId || null : undefined,
          color: body.color !== undefined ? body.color || null : undefined,

          // Pricing
          purchaseCost: body.purchaseCost !== undefined ? purchaseCost : undefined,
          sellingPrice: body.sellingPrice !== undefined ? sellingPrice : undefined,
          discountType: body.discountType !== undefined ? discountType : undefined,
          discountValue: body.discountValue !== undefined ? discountValue : undefined,
          finalSellingPrice,

          // Specs
          weight: body.weight !== undefined ? (body.weight ? Number(body.weight) : null) : undefined,
          weightUnit: body.weightUnit !== undefined ? body.weightUnit || null : undefined,
          lengthInMeters:
            body.lengthInMeters !== undefined
              ? body.lengthInMeters
                ? Number(body.lengthInMeters)
                : null
              : undefined,
          minimumStock: body.minimumStock !== undefined ? (Number(body.minimumStock) || 0) : undefined,
          maximumStock:
            body.maximumStock !== undefined
              ? body.maximumStock
                ? Number(body.maximumStock)
                : null
              : undefined,
          reorderLevel:
            body.reorderLevel !== undefined
              ? (Number(body.reorderLevel) || 0)
              : undefined,
          rackNumber: body.rackNumber !== undefined ? body.rackNumber || null : undefined,
          shelfNumber: body.shelfNumber !== undefined ? body.shelfNumber || null : undefined,

          taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
          isTaxable: body.isTaxable !== undefined ? Boolean(body.isTaxable) : undefined,
          imageUrl: body.imageUrl !== undefined ? body.imageUrl || null : undefined,
          status: body.status !== undefined ? body.status : undefined,
          updatedBy: userId,
        },
      });

      // Update images if provided
      if (body.imageUrls && Array.isArray(body.imageUrls)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (body.imageUrls.length > 0) {
          await tx.productImage.createMany({
            data: body.imageUrls.map((url: string, idx: number) => ({
              productId: id,
              url,
              isPrimary: idx === 0,
              order: idx,
            })),
          });
        }
      }

      // Update colors if provided
      if (body.colorIds && Array.isArray(body.colorIds)) {
        await tx.productColorMap.deleteMany({ where: { productId: id } });
        if (body.colorIds.length > 0) {
          await tx.productColorMap.createMany({
            data: body.colorIds.map((cId: string) => ({
              productId: id,
              colorId: cId,
            })),
          });
        }
      }

      // Update suppliers if provided
      if (body.suppliers && Array.isArray(body.suppliers)) {
        await tx.supplierProduct.deleteMany({ where: { productId: id } });
        for (const s of body.suppliers) {
          await tx.supplierProduct.create({
            data: {
              productId: id,
              supplierId: s.supplierId,
              purchaseReference: s.purchaseReference || null,
              supplierSku: s.supplierSku || null,
              isDefault: s.isDefault || false,
            },
          });
        }
      }

      // Audit Log
      try {
        await tx.auditLog.create({
          data: {
            organizationId,
            actorId: userId,
            action: "PRODUCT_UPDATED",
            entityType: "PRODUCT",
            entityId: id,
            newValues: {
              name: prod.name,
              sku: prod.sku,
              purchaseCost: Number(prod.purchaseCost),
              sellingPrice: Number(prod.sellingPrice),
              finalSellingPrice: Number(prod.finalSellingPrice),
            },
          },
        });
      } catch (logErr) {
        console.warn("Audit log skipped:", logErr);
      }

      return prod;
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("PATCH product [id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const userId = session?.user?.id;
    const { id } = await params;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: {
            saleItems: true,
            purchaseItems: true,
            stockTransferItems: true,
            stockAdjustmentItems: true,
            stockCountItems: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const hasTransactions =
      existing._count.saleItems > 0 ||
      existing._count.purchaseItems > 0 ||
      existing._count.stockTransferItems > 0 ||
      existing._count.stockAdjustmentItems > 0 ||
      existing._count.stockCountItems > 0;

    if (hasTransactions) {
      return NextResponse.json(
        {
          error:
            "Cannot delete product because it has historical transactions (sales, purchases, transfers, or inventory adjustments). Archive the product instead to preserve your audit trail.",
          canArchive: true,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.productBarcode.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productColorMap.deleteMany({ where: { productId: id } });
      await tx.supplierProduct.deleteMany({ where: { productId: id } });
      await tx.stockMovement.deleteMany({ where: { productId: id } });
      await tx.inventoryBalance.deleteMany({ where: { productId: id } });
      await tx.storageStockMovement.deleteMany({ where: { productId: id } });
      await tx.storageInventoryBalance.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: userId,
          action: "PRODUCT_DELETED",
          entityType: "PRODUCT",
          entityId: id,
          oldValues: {
            name: existing.name,
            sku: existing.sku,
            sellingPrice: Number(existing.sellingPrice),
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Product "${existing.name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE product [id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
