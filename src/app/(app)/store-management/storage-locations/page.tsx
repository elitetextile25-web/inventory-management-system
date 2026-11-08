import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StorageLocationsClient } from "@/components/store-management/storage-locations-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Storage Locations — FabricPro",
  description: "Track physical storage facilities, warehouses, and showrooms",
};

export default async function StorageLocationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    type?: string;
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
      { name: { contains: sp.search, mode: "insensitive" } },
      { code: { contains: sp.search, mode: "insensitive" } },
      { storeManager: { contains: sp.search, mode: "insensitive" } },
      { contactNumber: { contains: sp.search, mode: "insensitive" } },
      { fullAddress: { contains: sp.search, mode: "insensitive" } },
      { area: { contains: sp.search, mode: "insensitive" } },
      { district: { contains: sp.search, mode: "insensitive" } },
    ];
  }

  if (sp.type && sp.type !== "ALL") {
    where.type = sp.type;
  }

  if (sp.status && sp.status !== "ALL") {
    where.status = sp.status;
  }

  const [locations, total] = await Promise.all([
    prisma.storageLocation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        parentWarehouse: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            childWarehouses: true,
            purchaseOrders: true,
            inventoryBalances: true,
            transfersFrom: true,
            transfersTo: true,
          },
        },
      },
    }),
    prisma.storageLocation.count({ where }),
  ]);

  return (
    <StorageLocationsClient
      initialLocations={serializeData(locations) as any}
      total={total}
      page={page}
      limit={limit}
    />
  );
}

