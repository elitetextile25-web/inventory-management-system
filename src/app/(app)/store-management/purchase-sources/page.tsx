import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PurchaseSourcesClient } from "@/components/store-management/purchase-sources-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Purchase Sources — FabricPro",
  description: "Track where fabrics and products are purchased or sourced",
};

export default async function PurchaseSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    type?: string;
    country?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = { organizationId };

  if (sp.search) {
    where.OR = [
      { sourceName: { contains: sp.search, mode: "insensitive" } },
      { sourceCode: { contains: sp.search, mode: "insensitive" } },
      { supplierName: { contains: sp.search, mode: "insensitive" } },
      { contactPerson: { contains: sp.search, mode: "insensitive" } },
      { phoneNumber: { contains: sp.search, mode: "insensitive" } },
      { country: { contains: sp.search, mode: "insensitive" } },
      { city: { contains: sp.search, mode: "insensitive" } },
      { marketName: { contains: sp.search, mode: "insensitive" } },
    ];
  }

  if (sp.type && sp.type !== "ALL") {
    where.sourceType = sp.type;
  }

  if (sp.country && sp.country !== "ALL") {
    where.country = sp.country;
  }

  if (sp.status && sp.status !== "ALL") {
    where.status = sp.status;
  }

  const [sources, total] = await Promise.all([
    prisma.purchaseSource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    }),
    prisma.purchaseSource.count({ where }),
  ]);

  return (
    <PurchaseSourcesClient
      initialSources={serializeData(sources) as any}
      total={total}
      page={page}
      limit={limit}
    />
  );
}

