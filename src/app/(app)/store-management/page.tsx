import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StoreManagementDashboard } from "@/components/store-management/store-management-dashboard";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Store Management — FabricPro",
  description: "Overview of purchase sources and inventory storage locations",
};

export default async function StoreManagementPage() {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;

  const [
    totalPurchaseSources,
    activeSuppliers,
    totalStorageLocations,
    activeWarehouses,
    recentSources,
    recentLocations,
  ] = await Promise.all([
    prisma.purchaseSource.count({
      where: { organizationId },
    }),
    prisma.purchaseSource.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    prisma.storageLocation.count({
      where: { organizationId },
    }),
    prisma.storageLocation.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    prisma.purchaseSource.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.storageLocation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <StoreManagementDashboard
      metrics={{
        totalPurchaseSources,
        activeSuppliers,
        totalStorageLocations,
        activeWarehouses,
      }}
      recentSources={serializeData(recentSources) as any}
      recentLocations={serializeData(recentLocations) as any}
    />
  );
}

