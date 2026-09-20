import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { serializeData } from "@/lib/utils";

export const metadata = { title: "Expenses — FabricPro" };

export default async function ExpensesPage({
  searchParams,
}: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const [expenses, total, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { organizationId },
      include: { category: true },
      orderBy: { expenseDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.expense.count({ where: { organizationId } }),
    prisma.expenseCategory.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ExpensesClient expenses={serializeData(expenses)} total={total} page={page} pageSize={pageSize} categories={categories} />;
}
