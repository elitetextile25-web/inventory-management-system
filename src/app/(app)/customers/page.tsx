import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CustomersClient } from "@/components/customers/customers-client";
import { serializeData } from "@/lib/utils";

export const metadata = { title: "Customers — FabricPro" };

export default async function CustomersPage({
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
      { phone: { contains: sp.search } },
      { email: { contains: sp.search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return <CustomersClient customers={serializeData(customers)} total={total} page={page} pageSize={pageSize} />;
}
