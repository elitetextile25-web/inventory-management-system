import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SalesClient } from "@/components/sales/sales-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Sales — FabricPro",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  const storeId = (session?.user as any)?.storeId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = { storeId };
  if (sp.search) {
    where.OR = [
      { invoiceNumber: { contains: sp.search, mode: "insensitive" } },
      { customer: { name: { contains: sp.search, mode: "insensitive" } } },
    ];
  }
  if (sp.status) where.status = sp.status;

  const [sales, total] = await Promise.all([
    prisma.sales.findMany({
      where,
      include: { customer: { select: { name: true } } },
      orderBy: { saleDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.sales.count({ where }),
  ]);

  return <SalesClient sales={serializeData(sales)} total={total} page={page} pageSize={pageSize} />;
}
