import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewInvoiceClient } from "@/components/sales/new-invoice-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "New Invoice — FabricPro",
  description: "Create a new fabric invoice or retail bill",
};

export default async function NewInvoicePage() {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const storeId = (session?.user as any)?.storeId;

  const [products, customers, salesCount] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        unit: { select: { name: true, abbreviation: true } },
        category: { select: { name: true } },
        inventoryBalances: storeId ? { where: { storeId } } : { take: 1 },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, phone: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.sales.count({
      where: { storeId },
    }),
  ]);

  const year = new Date().getFullYear();
  const nextNumber = String(salesCount + 1).padStart(4, "0");
  const defaultInvoiceNumber = `INV-${year}-${nextNumber}`;

  return (
    <NewInvoiceClient
      products={serializeData(products)}
      customers={serializeData(customers)}
      defaultInvoiceNumber={defaultInvoiceNumber}
    />
  );
}
