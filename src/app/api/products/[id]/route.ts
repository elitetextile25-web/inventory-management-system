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
        inventoryBalances: {
          include: { store: true },
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        sku: body.sku !== undefined ? body.sku.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId || null : undefined,
        subcategoryId: body.subcategoryId !== undefined ? body.subcategoryId || null : undefined,
        shopId: body.shopId !== undefined ? body.shopId || null : undefined,
        brandId: body.brandId !== undefined ? body.brandId || null : undefined,
        unitId: body.unitId !== undefined ? body.unitId || null : undefined,
        purchaseCost: body.purchaseCost !== undefined ? Number(body.purchaseCost) : undefined,
        sellingPrice: body.sellingPrice !== undefined ? Number(body.sellingPrice) : undefined,
        minimumStock: body.minimumStock !== undefined ? Number(body.minimumStock) : undefined,
        reorderLevel: body.reorderLevel !== undefined ? Number(body.reorderLevel) : undefined,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
        isTaxable: body.isTaxable !== undefined ? Boolean(body.isTaxable) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        updatedBy: userId,
      },
    });

    return NextResponse.json({ success: true, product });
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

    return NextResponse.json({ success: true, message: `Product "${existing.name}" deleted successfully` });
  } catch (error: any) {
    console.error("DELETE product [id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
