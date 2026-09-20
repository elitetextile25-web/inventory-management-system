import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentsClient } from "@/components/payments/payments-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Payments — FabricPro",
  description: "Track receivables, payables, and account transactions",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; method?: string; page?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (sp.search) {
    where.OR = [
      { reference: { contains: sp.search, mode: "insensitive" } },
      { customer: { name: { contains: sp.search, mode: "insensitive" } } },
      { supplier: { name: { contains: sp.search, mode: "insensitive" } } },
    ];
  }
  if (sp.type) where.type = sp.type;
  if (sp.method) where.method = sp.method;

  const [payments, total, totalReceived, totalPaid] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        supplier: { select: { name: true } },
        cashAccount: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: { type: "SALE_PAYMENT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { type: { in: ["PURCHASE_PAYMENT", "EXPENSE_PAYMENT"] }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  return (
    <PaymentsClient
      payments={serializeData(payments)}
      total={total}
      page={page}
      pageSize={pageSize}
      stats={{
        totalReceived: Number(totalReceived._sum.amount ?? 0),
        totalPaid: Number(totalPaid._sum.amount ?? 0),
      }}
    />
  );
}
