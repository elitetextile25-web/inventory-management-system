import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewTransferForm } from "@/components/store-management/new-transfer-form";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "New Stock Transfer — FabricPro",
  description: "Execute inventory transfer between warehouses and showrooms",
};

export default async function NewStockTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceId?: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const sp = await searchParams;

  const [locations, products] = await Promise.all([
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
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <NewTransferForm
      locations={serializeData(locations) as any}
      products={serializeData(products) as any}
      defaultSourceId={sp.sourceId}
    />
  );
}

