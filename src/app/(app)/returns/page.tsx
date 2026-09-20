import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReturnsClient } from "@/components/returns/returns-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Returns — FabricPro",
  description: "Manage sale and purchase returns",
};

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (sp.search) {
    where.OR = [
      { returnNumber: { contains: sp.search, mode: "insensitive" } },
      { sale: { invoiceNumber: { contains: sp.search, mode: "insensitive" } } },
    ];
  }
  if (sp.status) where.status = sp.status;

  const [returns, total] = await Promise.all([
    prisma.saleReturn.findMany({
      where,
      include: {
        sale: {
          select: {
            invoiceNumber: true,
            customer: { select: { name: true } },
          },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.saleReturn.count({ where }),
  ]);

  return <ReturnsClient returns={serializeData(returns)} total={total} page={page} pageSize={pageSize} />;
}
