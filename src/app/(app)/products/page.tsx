import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductsClient } from "@/components/products/products-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Products — FabricPro",
  description: "Manage your product catalog, pricing, and stock",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string; page?: string }>;
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
      { sku: { contains: sp.search, mode: "insensitive" } },
    ];
  }
  if (sp.category) where.categoryId = sp.category;
  if (sp.status) where.status = sp.status;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        unit: { select: { name: true, abbreviation: true } },
        inventoryBalances: storeId ? { where: { storeId } } : undefined,
        barcodes: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProductsClient
      products={serializeData(products)}
      total={total}
      page={page}
      pageSize={pageSize}
      categories={categories}
      storeId={storeId}
    />
  );
}
