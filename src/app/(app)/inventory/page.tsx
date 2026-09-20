export const metadata = { title: "Inventory — FabricPro" };
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InventoryClient } from "@/components/inventory/inventory-client";
import { serializeData } from "@/lib/utils";

export default async function InventoryPage({
  searchParams,
}: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const session = await auth();
  const storeId = (session?.user as any)?.storeId;
  const organizationId = (session?.user as any)?.organizationId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const where: any = { organizationId };
  if (sp.search) where.OR = [
    { name: { contains: sp.search, mode: "insensitive" } },
    { sku: { contains: sp.search, mode: "insensitive" } },
  ];

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { ...where, status: "ACTIVE" },
      include: {
        inventoryBalances: storeId ? { where: { storeId } } : { take: 1 },
        unit: { select: { abbreviation: true } },
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      skip, take: pageSize,
    }),
    prisma.product.count({ where: { ...where, status: "ACTIVE" } }),
  ]);

  return <InventoryClient products={serializeData(products)} total={total} page={page} pageSize={pageSize} storeId={storeId} />;
}
