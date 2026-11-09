import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewAdjustmentForm } from "@/components/inventory/new-adjustment-form";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "New Stock Adjustment — FabricPro",
  description: "Reconcile physical fabric variances, damage, and inventory adjustments",
};

export default async function NewStockAdjustmentPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const sessionStoreId = (session?.user as any)?.storeId;
  const sp = await searchParams;

  const [stores, storageLocations, products] = await Promise.all([
    prisma.store.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, isDefault: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.storageLocation.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true, name: true, code: true, type: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sku: true,
        purchaseCost: true,
        unit: { select: { abbreviation: true } },
        inventoryBalances: {
          select: {
            storeId: true,
            quantity: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const defaultStoreId = sp.storeId || sessionStoreId || stores[0]?.id;

  return (
    <NewAdjustmentForm
      stores={serializeData(stores) as any}
      storageLocations={serializeData(storageLocations) as any}
      products={serializeData(products) as any}
      defaultStoreId={defaultStoreId}
    />
  );
}

