import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PurchasesClient } from "@/components/purchases/purchases-client";
import { serializeData } from "@/lib/utils";

export const metadata = { title: "Purchases — FabricPro" };

export default async function PurchasesPage({
  searchParams,
}: { searchParams: Promise<{ search?: string; status?: string; page?: string }> }) {
  const session = await auth();
  const storeId = (session?.user as any)?.storeId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = { storeId };
  if (sp.search) {
    where.OR = [
      { orderNumber: { contains: sp.search, mode: "insensitive" } },
      { supplier: { name: { contains: sp.search, mode: "insensitive" } } },
    ];
  }
  if (sp.status) where.status = sp.status;

  const [purchases, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: { supplier: { select: { name: true } } },
      orderBy: { orderDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return <PurchasesClient purchases={serializeData(purchases)} total={total} page={page} pageSize={pageSize} />;
}
