import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PurchaseSourceForm } from "@/components/store-management/purchase-source-form";
import { serializeData } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await prisma.purchaseSource.findUnique({
    where: { id },
    select: { sourceName: true },
  });
  return {
    title: source ? `Edit ${source.sourceName} — FabricPro` : "Edit Purchase Source — FabricPro",
  };
}

export default async function EditPurchaseSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;

  const source = await prisma.purchaseSource.findFirst({
    where: { id, organizationId },
  });

  if (!source) {
    notFound();
  }

  return <PurchaseSourceForm initialData={serializeData(source) as any} isEdit={true} />;
}

