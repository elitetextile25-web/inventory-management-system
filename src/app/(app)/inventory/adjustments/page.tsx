import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdjustmentsClient } from "@/components/inventory/adjustments-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Stock Adjustments — FabricPro",
  description: "Reconcile physical stock variances due to damage, expiry, theft, or recounting",
};

export default async function StockAdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; storeId?: string; page?: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const sessionStoreId = (session?.user as any)?.storeId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Find stores for organization
  const stores = await prisma.store.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const orgStoreIds = stores.map((s) => s.id);

  const where: any = {};

  if (sp.storeId && sp.storeId !== "ALL") {
    where.storeId = sp.storeId;
  } else if (sessionStoreId) {
    where.storeId = sessionStoreId;
  } else if (orgStoreIds.length > 0) {
    where.storeId = { in: orgStoreIds };
  }

  if (sp.status && sp.status !== "ALL") {
    where.status = sp.status;
  }

  if (sp.search) {
    where.OR = [
      { reference: { contains: sp.search, mode: "insensitive" } },
      { reason: { contains: sp.search, mode: "insensitive" } },
      { notes: { contains: sp.search, mode: "insensitive" } },
    ];
  }

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: { select: { abbreviation: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return (
    <AdjustmentsClient
      adjustments={serializeData(adjustments) as any}
      total={total}
      page={page}
      pageSize={pageSize}
      stores={serializeData(stores) as any}
    />
  );
}
