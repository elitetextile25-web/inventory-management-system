import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductsClient } from "@/components/products/products-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Products & Fabrics — FabricPro",
  description: "Advanced product management, unique codes, pricing, and stock tracking",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    subcategory?: string;
    productType?: string;
    color?: string;
    unit?: string;
    warehouse?: string;
    supplier?: string;
    stockStatus?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const storeId = (session?.user as any)?.storeId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = { organizationId };

  if (sp.search) {
    where.OR = [
      { name: { contains: sp.search, mode: "insensitive" } },
      { productCode: { contains: sp.search, mode: "insensitive" } },
      { sku: { contains: sp.search, mode: "insensitive" } },
      { barcodes: { some: { barcode: { contains: sp.search, mode: "insensitive" } } } },
    ];
  }

  if (sp.category && sp.category !== "ALL") where.categoryId = sp.category;
  if (sp.subcategory && sp.subcategory !== "ALL") where.subcategoryId = sp.subcategory;
  if (sp.productType && sp.productType !== "ALL") where.productType = sp.productType;
  if (sp.unit && sp.unit !== "ALL") where.unitId = sp.unit;
  if (sp.status && sp.status !== "ALL") where.status = sp.status;
  if (sp.warehouse && sp.warehouse !== "ALL") {
    where.OR = [
      { storageLocationId: sp.warehouse },
      { storageBalances: { some: { storageLocationId: sp.warehouse } } },
    ];
  }
  if (sp.supplier && sp.supplier !== "ALL") {
    where.supplierProducts = { some: { supplierId: sp.supplier } };
  }
  if (sp.color && sp.color !== "ALL") {
    where.OR = [
      { color: { equals: sp.color, mode: "insensitive" } },
      { colors: { some: { color: { name: { equals: sp.color, mode: "insensitive" } } } } },
    ];
  }

  const [products, total, categories, units, storageLocations, suppliers, colors] =
    await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true, abbreviation: true } },
          storageLocation: { select: { id: true, name: true, code: true, type: true } },
          images: { take: 1, orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
          colors: { include: { color: true } },
          inventoryBalances: storeId ? { where: { storeId } } : undefined,
          storageBalances: {
            include: { storageLocation: { select: { id: true, name: true, code: true } } },
          },
          supplierProducts: {
            take: 1,
            include: { supplier: { select: { id: true, name: true } } },
          },
          barcodes: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { organizationId, isActive: true, parentId: null },
        select: {
          id: true,
          name: true,
          children: {
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.unit.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, abbreviation: true },
        orderBy: { name: "asc" },
      }),
      prisma.storageLocation.findMany({
        where: { organizationId, status: "ACTIVE" },
        select: { id: true, name: true, code: true, type: true },
        orderBy: { name: "asc" },
      }),
      prisma.supplier.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, company: true },
        orderBy: { name: "asc" },
      }),
      prisma.color.findMany({
        where: { organizationId },
        select: { id: true, name: true, hexCode: true },
        orderBy: { name: "asc" },
      }),
    ]);

  return (
    <ProductsClient
      products={serializeData(products)}
      total={total}
      page={page}
      pageSize={pageSize}
      categories={serializeData(categories) as any}
      units={serializeData(units) as any}
      storageLocations={serializeData(storageLocations) as any}
      suppliers={serializeData(suppliers) as any}
      colors={serializeData(colors) as any}
      storeId={storeId}
    />
  );
}
