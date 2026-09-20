"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, RotateCcw, Eye, PackageCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReturnsClientProps {
  returns: any[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  DRAFT: "secondary",
  CONFIRMED: "default",
  REFUNDED: "success",
  PARTIALLY_REFUNDED: "warning",
  VOIDED: "danger",
};

export function ReturnsClient({ returns, total, page, pageSize }: ReturnsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") ?? "");

  const totalPages = Math.ceil(total / pageSize);

  const applyFilters = (newSearch?: string, newStatus?: string) => {
    const params = new URLSearchParams(searchParams);
    const s = newSearch !== undefined ? newSearch : search;
    const st = newStatus !== undefined ? newStatus : statusFilter;

    if (s) params.set("search", s);
    else params.delete("search");

    if (st) params.set("status", st);
    else params.delete("status");

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-primary" />
            Returns & Refunds
          </h1>
          <p className="text-sm text-muted-foreground">
            Process item returns, inventory restocking, and customer refunds ({total} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => router.push("/sales")}>
            <Plus className="w-4 h-4" />
            Return from Sale
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by return # or invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              applyFilters(undefined, e.target.value);
            }}
            aria-label="Filter by Status"
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
            <option value="VOIDED">Voided</option>
          </select>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
                <th className="px-4 py-3">Return #</th>
                <th className="px-4 py-3">Sale Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Refund Total</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No returns found
                  </td>
                </tr>
              ) : (
                returns.map((ret: any) => (
                  <tr key={ret.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-primary">{ret.returnNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{ret.sale?.invoiceNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ret.sale?.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(ret.returnDate)}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium">{ret.items?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-danger">
                      {formatCurrency(Number(ret.totalAmount))}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                      {ret.reason || "Defective / Customer change"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ret.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages} ({total} returns)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(page - 1));
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(page + 1));
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
