import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewPurchaseClient } from "@/components/purchases/new-purchase-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "New Purchase Order — FabricPro",
  description: "Record a new fabric purchase or mill order",
};

export default async function NewPurchasePage() {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const storeId = (session?.user as any)?.storeId;

  const [products, suppliers, orderCount] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        unit: { select: { name: true, abbreviation: true } },
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, company: true, phone: true },
      orderBy: { name: "asc" },
    }),
    prisma.purchaseOrder.count({
      where: { storeId },
    }),
  ]);

  const year = new Date().getFullYear();
  const nextNumber = String(orderCount + 1).padStart(4, "0");
  const defaultOrderNumber = `PO-${year}-${nextNumber}`;

  return (
    <NewPurchaseClient
      products={serializeData(products) as any}
      suppliers={serializeData(suppliers) as any}
      defaultOrderNumber={defaultOrderNumber}
    />
  );
}
