import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { formatCurrency } from "@/lib/utils";

async function getDashboardData(storeId: string, organizationId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    salesToday, salesMonth, salesYear,
    purchasesMonth,
    expensesMonth,
    customersCount,
    suppliersCount,
    lowStockProducts,
    recentSales,
    monthlySalesTrend,
  ] = await Promise.all([
    // Sales today
    prisma.sales.aggregate({
      where: { storeId, saleDate: { gte: startOfToday }, status: { notIn: ["VOIDED"] } },
      _sum: { grandTotal: true, paidAmount: true },
      _count: true,
    }),
    // Sales this month
    prisma.sales.aggregate({
      where: { storeId, saleDate: { gte: startOfMonth }, status: { notIn: ["VOIDED"] } },
      _sum: { grandTotal: true, dueAmount: true },
    }),
    // Sales this year
    prisma.sales.aggregate({
      where: { storeId, saleDate: { gte: startOfYear }, status: { notIn: ["VOIDED"] } },
      _sum: { grandTotal: true },
    }),
    // Purchases this month
    prisma.purchaseOrder.aggregate({
      where: { storeId, orderDate: { gte: startOfMonth }, status: { notIn: ["CANCELLED"] } },
      _sum: { grandTotal: true, dueAmount: true },
    }),
    // Expenses this month
    prisma.expense.aggregate({
      where: { organizationId, expenseDate: { gte: startOfMonth }, status: { notIn: ["VOIDED"] } },
      _sum: { amount: true },
    }),
    // Total active customers
    prisma.customer.count({ where: { organizationId, isActive: true } }),
    // Total active suppliers
    prisma.supplier.count({ where: { organizationId, isActive: true } }),
    // Low stock products
    prisma.$queryRaw<{ id: string; name: string; sku: string; quantity: number; minimumStock: number }[]>`
      SELECT p.id, p.name, p.sku, COALESCE(ib.quantity, 0) as quantity, p."minimumStock"
      FROM products p
      LEFT JOIN inventory_balances ib ON ib."productId" = p.id AND ib."storeId" = ${storeId}
      WHERE p."organizationId" = ${organizationId}
        AND p.status = 'ACTIVE'
        AND COALESCE(ib.quantity, 0) <= p."minimumStock"
        AND p."minimumStock" > 0
      ORDER BY quantity ASC
      LIMIT 10
    `,
    // Recent sales
    prisma.sales.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        invoiceNumber: true,
        saleDate: true,
        grandTotal: true,
        paidAmount: true,
        status: true,
        customer: { select: { name: true } },
      },
    }),
    // Monthly sales trend (last 6 months)
    prisma.$queryRaw<{ month: string; sales: number; purchases: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', s."saleDate"), 'Mon') as month,
        COALESCE(SUM(s."grandTotal"), 0)::float as sales,
        0::float as purchases
      FROM sales s
      WHERE s."storeId" = ${storeId}
        AND s."saleDate" >= NOW() - INTERVAL '6 months'
        AND s.status NOT IN ('VOIDED')
      GROUP BY DATE_TRUNC('month', s."saleDate")
      ORDER BY DATE_TRUNC('month', s."saleDate") ASC
    `,
  ]);

  const grossProfit = Number(salesMonth._sum.grandTotal ?? 0) * 0.3; // simplified
  const netProfit = grossProfit - Number(expensesMonth._sum.amount ?? 0);

  return {
    kpis: {
      salesToday: Number(salesToday._sum.grandTotal ?? 0),
      salesMonth: Number(salesMonth._sum.grandTotal ?? 0),
      salesYear: Number(salesYear._sum.grandTotal ?? 0),
      purchasesMonth: Number(purchasesMonth._sum.grandTotal ?? 0),
      expensesMonth: Number(expensesMonth._sum.amount ?? 0),
      receivables: Number(salesMonth._sum.dueAmount ?? 0),
      payables: Number(purchasesMonth._sum.dueAmount ?? 0),
      grossProfit,
      netProfit,
      customersCount,
      suppliersCount,
      salesTodayCount: salesToday._count,
    },
    lowStockProducts,
    recentSales,
    monthlySalesTrend,
  };
}

import { serializeData } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const storeId = (session?.user as any)?.storeId;
  const organizationId = (session?.user as any)?.organizationId;

  let data = null;
  if (storeId && organizationId) {
    try {
      const rawData = await getDashboardData(storeId, organizationId);
      data = serializeData(rawData);
    } catch {
      data = null;
    }
  }

  return <DashboardClient data={data} />;
}
