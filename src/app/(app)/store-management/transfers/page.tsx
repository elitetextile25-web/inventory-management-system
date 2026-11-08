import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StockTransfersClient } from "@/components/store-management/stock-transfers-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Stock Transfers — FabricPro",
  description: "Track inventory movements and transfers between storage locations",
};

export default async function StockTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    source?: string;
    destination?: string;
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
      { transferNumber: { contains: sp.search, mode: "insensitive" } },
      { sourceLocation: { name: { contains: sp.search, mode: "insensitive" } } },
      { destinationLocation: { name: { contains: sp.search, mode: "insensitive" } } },
    ];
  }

  if (sp.source && sp.source !== "ALL") {
    where.sourceLocationId = sp.source;
  }

  if (sp.destination && sp.destination !== "ALL") {
    where.destinationLocationId = sp.destination;
  }

  const [transfers, total, locations] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      orderBy: { transferDate: "desc" },
      skip,
      take: limit,
      include: {
        sourceLocation: {
          select: { id: true, name: true, code: true },
        },
        destinationLocation: {
          select: { id: true, name: true, code: true },
        },
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
    }),
    prisma.stockTransfer.count({ where }),
    prisma.storageLocation.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <StockTransfersClient
      initialTransfers={serializeData(transfers) as any}
      locations={serializeData(locations) as any}
      total={total}
      page={page}
      limit={limit}
    />
  );
}

