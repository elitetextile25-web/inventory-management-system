import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PurchaseSourceDetail } from "@/components/store-management/purchase-source-detail";
import { serializeData } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await prisma.purchaseSource.findUnique({
    where: { id },
    select: { sourceName: true, sourceCode: true },
  });
  return {
    title: source ? `${source.sourceName} (${source.sourceCode}) — FabricPro` : "Purchase Source — FabricPro",
  };
}

export default async function PurchaseSourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;

  const source = await prisma.purchaseSource.findFirst({
    where: { id, organizationId },
    include: {
      purchaseOrders: {
        take: 10,
        orderBy: { orderDate: "desc" },
        include: {
          items: true,
        },
      },
      _count: {
        select: { purchaseOrders: true },
      },
    },
  });

  if (!source) {
    notFound();
  }

  return <PurchaseSourceDetail source={serializeData(source) as any} />;
}

