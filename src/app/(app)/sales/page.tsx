import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SalesClient } from "@/components/sales/sales-client";
import { serializeData } from "@/lib/utils";

export const metadata = {
  title: "Sales & Invoices — FabricPro",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    startDate?: string;
    endDate?: string;
    year?: string;
    preset?: string;
  }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const storeId = (session?.user as any)?.storeId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (storeId) {
    where.storeId = storeId;
  } else if (organizationId) {
    where.store = { organizationId };
  }

  if (sp.search) {
    where.OR = [
      { invoiceNumber: { contains: sp.search, mode: "insensitive" } },
      { customer: { name: { contains: sp.search, mode: "insensitive" } } },
    ];
  }

  if (sp.status) {
    where.status = sp.status;
  }

  // Date Filtering: Specific Year (e.g. 2025, 2024, etc.)
  if (sp.year) {
    const yr = parseInt(sp.year, 10);
    if (!isNaN(yr)) {
      where.saleDate = {
        gte: new Date(yr, 0, 1, 0, 0, 0, 0),
        lte: new Date(yr, 11, 31, 23, 59, 59, 999),
      };
    }
  } else if (sp.startDate || sp.endDate) {
    where.saleDate = {};
    if (sp.startDate) {
      const start = new Date(sp.startDate);
      start.setHours(0, 0, 0, 0);
      where.saleDate.gte = start;
    }
    if (sp.endDate) {
      const end = new Date(sp.endDate);
      end.setHours(23, 59, 59, 999);
      where.saleDate.lte = end;
    }
  }

  const [sales, total] = await Promise.all([
    prisma.sales.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        store: { select: { name: true, address: true, phone: true } },
        salesperson: { select: { name: true } },
        items: {
          include: {
            product: {
              include: { unit: true },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { saleDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.sales.count({ where }),
  ]);

  return (
    <SalesClient
      sales={serializeData(sales)}
      total={total}
      page={page}
      pageSize={pageSize}
      filters={{
        search: sp.search || "",
        status: sp.status || "",
        startDate: sp.startDate || "",
        endDate: sp.endDate || "",
        year: sp.year || "",
        preset: sp.preset || "all",
      }}
    />
  );
}
