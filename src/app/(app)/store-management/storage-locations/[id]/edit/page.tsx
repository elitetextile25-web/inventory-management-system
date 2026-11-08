import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { StorageLocationForm } from "@/components/store-management/storage-location-form";
import { serializeData } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await prisma.storageLocation.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: location ? `Edit ${location.name} — FabricPro` : "Edit Storage Location — FabricPro",
  };
}

export default async function EditStorageLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;

  const [location, warehouses] = await Promise.all([
    prisma.storageLocation.findFirst({
      where: { id, organizationId },
    }),
    prisma.storageLocation.findMany({
      where: { organizationId, status: "ACTIVE", id: { not: id } },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <StorageLocationForm
      initialData={serializeData(location) as any}
      isEdit={true}
      warehousesList={serializeData(warehouses) as any}
    />
  );
}

