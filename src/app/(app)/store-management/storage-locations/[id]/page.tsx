import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { StorageLocationDetail } from "@/components/store-management/storage-location-detail";
import { serializeData } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await prisma.storageLocation.findUnique({
    where: { id },
    select: { name: true, code: true },
  });
  return {
    title: location ? `${location.name} (${location.code}) — FabricPro` : "Storage Location — FabricPro",
  };
}

export default async function StorageLocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;

  const location = await prisma.storageLocation.findFirst({
    where: { id, organizationId },
    include: {
      parentWarehouse: {
        select: { id: true, name: true, code: true },
      },
      childWarehouses: {
        select: { id: true, name: true, code: true, type: true, status: true },
      },
      inventoryBalances: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              purchaseCost: true,
              sellingPrice: true,
              unit: { select: { name: true, abbreviation: true } },
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { quantity: "desc" },
        take: 50,
      },
      stockMovements: {
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
      _count: {
        select: {
          purchaseOrders: true,
          transfersFrom: true,
          transfersTo: true,
          childWarehouses: true,
          inventoryBalances: true,
        },
      },
    },
  });

  if (!location) {
    notFound();
  }

  return <StorageLocationDetail location={serializeData(location) as any} />;
}

