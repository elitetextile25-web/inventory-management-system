import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Plus, Search, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export const metadata = {
  title: "Stock Adjustments — FabricPro",
};

export default async function StockAdjustmentsPage({
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

  const where: any = {};
  if (storeId) where.storeId = storeId;
  if (sp.search) {
    where.OR = [
      { reference: { contains: sp.search, mode: "insensitive" } },
      { reason: { contains: sp.search, mode: "insensitive" } },
    ];
  }
  if (sp.status) where.status = sp.status;

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Stock Adjustments
          </h1>
          <p className="text-sm text-muted-foreground">
            Reconcile physical stock variances due to damage, expiry, theft, or recounting ({total} records)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New Stock Adjustment
          </Button>
        </div>
      </div>

      {/* Adjustments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase text-left">
                <th className="px-4 py-3">Reference #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Items Adjusted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No stock adjustments recorded
                  </td>
                </tr>
              ) : (
                adjustments.map((adj: any) => (
                  <tr key={adj.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-primary font-mono text-xs">
                      {adj.reference}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(adj.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-xs">
                      <span className="px-2 py-0.5 rounded bg-muted">
                        {adj.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-xs">
                      {adj.items.length} items
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={adj.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {adj.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
