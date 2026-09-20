import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";
import { serializeData } from "@/lib/utils";

export const metadata = { title: "Suppliers — FabricPro" };

export default async function SuppliersPage({
  searchParams,
}: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = { organizationId };
  if (sp.search) {
    where.OR = [
      { name: { contains: sp.search, mode: "insensitive" } },
      { company: { contains: sp.search, mode: "insensitive" } },
      { phone: { contains: sp.search } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: { _count: { select: { purchaseOrders: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return <SuppliersClient suppliers={serializeData(suppliers)} total={total} page={page} pageSize={pageSize} />;
}
