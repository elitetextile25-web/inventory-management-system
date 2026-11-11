import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProductCodePrefix, generateUniqueProductCode } from "@/lib/product-code";

export async function POST(
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

    const source = await prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        colors: true,
        images: true,
        supplierProducts: true,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Original product not found" }, { status: 404 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const prefix = getProductCodePrefix(source.productType, source.category?.name);
      const newProductCode = await generateUniqueProductCode(tx, organizationId, prefix);
      const newSku = newProductCode;

      const duplicated = await tx.product.create({
        data: {
          organizationId,
          productCode: newProductCode,
          sku: newSku,
          name: `${source.name} (Copy)`,
          description: source.description,
          categoryId: source.categoryId,
          subcategoryId: source.subcategoryId,
          brandId: source.brandId,
          unitId: source.unitId,
          shopId: source.shopId,
          productType: source.productType,
          color: source.color,
          purchaseCost: source.purchaseCost,
          sellingPrice: source.sellingPrice,
          discountType: source.discountType,
          discountValue: source.discountValue,
          finalSellingPrice: source.finalSellingPrice,
          weight: source.weight,
          weightUnit: source.weightUnit,
          lengthInMeters: source.lengthInMeters,
          minimumStock: source.minimumStock,
          maximumStock: source.maximumStock,
          reorderLevel: source.reorderLevel,
          rackNumber: source.rackNumber,
          shelfNumber: source.shelfNumber,
          storageLocationId: source.storageLocationId,
          taxRate: source.taxRate,
          isTaxable: source.isTaxable,
          imageUrl: source.imageUrl,
          status: "ACTIVE",
          createdBy: userId,
        },
      });

      // Duplicate images
      if (source.images.length > 0) {
        await tx.productImage.createMany({
          data: source.images.map((img) => ({
            productId: duplicated.id,
            url: img.url,
            isPrimary: img.isPrimary,
            order: img.order,
          })),
        });
      }

      // Duplicate colors
      if (source.colors.length > 0) {
        await tx.productColorMap.createMany({
          data: source.colors.map((c) => ({
            productId: duplicated.id,
            colorId: c.colorId,
          })),
        });
      }

      // Duplicate supplier links
      if (source.supplierProducts.length > 0) {
        await tx.supplierProduct.createMany({
          data: source.supplierProducts.map((sp) => ({
            productId: duplicated.id,
            supplierId: sp.supplierId,
            supplierSku: sp.supplierSku,
            leadTime: sp.leadTime,
            minOrder: sp.minOrder,
            isDefault: sp.isDefault,
            purchaseReference: sp.purchaseReference,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: userId,
          action: "PRODUCT_DUPLICATED",
          entityType: "PRODUCT",
          entityId: duplicated.id,
          newValues: {
            duplicatedFrom: source.id,
            productCode: newProductCode,
            name: duplicated.name,
          },
        },
      });

      return duplicated;
    });

    return NextResponse.json({
      success: true,
      message: `Product duplicated successfully as "${newProduct.name}"`,
      data: newProduct,
    });
  } catch (error: any) {
    console.error("Duplicate product error:", error);
    return NextResponse.json({ error: error.message || "Failed to duplicate product" }, { status: 500 });
  }
}

