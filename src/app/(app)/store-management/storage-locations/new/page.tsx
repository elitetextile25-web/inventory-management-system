import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StorageLocationForm } from "@/components/store-management/storage-location-form";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "New Storage Location — FabricPro",
  description: "Register a physical warehouse, storage facility, or showroom",
};

export default async function NewStorageLocationPage() {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;

  const warehouses = await prisma.storageLocation.findMany({
    where: { organizationId, status: "ACTIVE" },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <StorageLocationForm
      isEdit={false}
      warehousesList={serializeData(warehouses) as any}
    />
  );
}

