"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Store as StoreIcon,
  FileText,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface AdjustmentItem {
  id: string;
  productId: string;
  systemQuantity: any;
  adjustedQuantity: any;
  difference: any;
  notes?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit?: { abbreviation: string } | null;
  };
}

interface StockAdjustmentRecord {
  id: string;
  storeId: string;
  reference: string;
  reason: string;
  notes?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  items: AdjustmentItem[];
}

interface AdjustmentsClientProps {
  adjustments: StockAdjustmentRecord[];
  total: number;
  page: number;
  pageSize: number;
  stores?: { id: string; name: string }[];
}

export function AdjustmentsClient({
  adjustments,
  total,
  page,
  pageSize,
  stores = [],
}: AdjustmentsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [selectedStatus, setSelectedStatus] = React.useState(
    searchParams.get("status") ?? "ALL"
  );
  const [selectedStore, setSelectedStore] = React.useState(
    searchParams.get("storeId") ?? "ALL"
  );

  // Details Modal State
  const [activeAdjustment, setActiveAdjustment] =
    React.useState<StockAdjustmentRecord | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (!v || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inventory/adjustments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve adjustment");
      }
      toast.success(data.message || "Adjustment approved & inventory reconciled!");
      setActiveAdjustment(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve adjustment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm("Are you sure you want to void this stock adjustment?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inventory/adjustments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VOID" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to void adjustment");
      }
      toast.success(data.message || "Adjustment voided.");
      setActiveAdjustment(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to void adjustment");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
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
          <Button size="sm" asChild className="gap-1.5 shadow-sm">
            <Link href="/inventory/adjustments/new">
              <Plus className="w-4 h-4" />
              New Stock Adjustment
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reference, reason, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
              className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {stores.length > 1 && (
              <select
                value={selectedStore}
                onChange={(e) => {
                  setSelectedStore(e.target.value);
                  applyFilters({ storeId: e.target.value });
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
              {["ALL", "APPROVED", "DRAFT", "VOIDED"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedStatus(st);
                    applyFilters({ status: st });
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedStatus === st
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase text-left">
                <th className="px-4 py-3">Reference #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-center">Items Count</th>
                <th className="px-4 py-3 text-right">Net Variance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-sm">No stock adjustments recorded</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the "New Stock Adjustment" button to reconcile physical inventory counts.
                    </p>
                    <Button size="sm" asChild className="mt-4 gap-1.5">
                      <Link href="/inventory/adjustments/new">
                        <Plus className="w-4 h-4" /> Create First Adjustment
                      </Link>
                    </Button>
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => {
                  const netDiff = adj.items.reduce(
                    (sum, i) => sum + Number(i.difference || 0),
                    0
                  );

                  return (
                    <tr
                      key={adj.id}
                      onClick={() => setActiveAdjustment(adj)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-primary font-mono text-xs">
                        {adj.reference}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(adj.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-xs">
                        <span className="px-2 py-0.5 rounded bg-muted/70 border border-border/40">
                          {adj.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-xs">
                        {adj.items.length} items
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                            netDiff > 0
                              ? "bg-success/15 text-success"
                              : netDiff < 0
                              ? "bg-danger/15 text-danger"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {netDiff > 0 ? (
                            <>
                              <TrendingUp className="w-3 h-3" /> +{formatNumber(netDiff, 2)}
                            </>
                          ) : netDiff < 0 ? (
                            <>
                              <TrendingDown className="w-3 h-3" /> {formatNumber(netDiff, 2)}
                            </>
                          ) : (
                            "0.00"
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={adj.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                        {adj.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setActiveAdjustment(adj)}
                          title="View Details"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => applyFilters({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => applyFilters({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Adjustment Detail Modal */}
      {activeAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold font-mono text-primary">
                      {activeAdjustment.reference}
                    </CardTitle>
                    <StatusBadge status={activeAdjustment.status} />
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Recorded on {formatDate(activeAdjustment.createdAt)} · Reason:{" "}
                    <span className="font-semibold text-foreground">{activeAdjustment.reason}</span>
                  </CardDescription>
                </div>
                <button
                  onClick={() => setActiveAdjustment(null)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 overflow-y-auto flex-1">
              {activeAdjustment.notes && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs">
                  <span className="font-semibold text-foreground">Remarks:</span>{" "}
                  <span className="text-muted-foreground">{activeAdjustment.notes}</span>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Adjusted Line Items ({activeAdjustment.items.length})
                </h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <th className="px-3 py-2 text-left">Fabric / Item</th>
                        <th className="px-3 py-2 text-right">System</th>
                        <th className="px-3 py-2 text-right">Physical</th>
                        <th className="px-3 py-2 text-right">Variance</th>
                        <th className="px-3 py-2 text-left">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeAdjustment.items.map((item) => {
                        const diff = Number(item.difference);
                        const unitAbbr = item.product?.unit?.abbreviation || "units";
                        return (
                          <tr key={item.id}>
                            <td className="px-3 py-2.5">
                              <p className="font-semibold text-foreground">
                                {item.product?.name || "Unknown Product"}
                              </p>
                              <p className="text-[10px] font-mono text-muted-foreground">
                                {item.product?.sku}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono">
                              {formatNumber(Number(item.systemQuantity), 2)} {unitAbbr}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                              {formatNumber(Number(item.adjustedQuantity), 2)} {unitAbbr}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono">
                              <span
                                className={`font-bold ${
                                  diff > 0
                                    ? "text-success"
                                    : diff < 0
                                    ? "text-danger"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {diff > 0 ? `+${formatNumber(diff, 2)}` : formatNumber(diff, 2)}{" "}
                                {unitAbbr}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {item.notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons if DRAFT */}
              {activeAdjustment.status === "DRAFT" && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleVoid(activeAdjustment.id)}
                    className="gap-1.5 text-danger border-danger/30 hover:bg-danger/10"
                  >
                    <Ban className="w-3.5 h-3.5" /> Void Adjustment
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleApprove(activeAdjustment.id)}
                    className="gap-1.5"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Approve &amp; Reconcile Inventory
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

