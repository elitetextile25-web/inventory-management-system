"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Eye,
  Warehouse,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";

interface TransferItem {
  id: string;
  transferNumber: string;
  transferDate: string;
  status: string;
  notes?: string | null;
  sourceLocation: { id: string; name: string; code: string };
  destinationLocation: { id: string; name: string; code: string };
  items: {
    id: string;
    quantity: number | string;
    unitCost: number | string;
    notes?: string | null;
    product: { id: string; name: string; sku: string; unit?: { abbreviation: string } | null };
  }[];
  createdAt: string;
}

interface StockTransfersClientProps {
  initialTransfers: TransferItem[];
  locations: { id: string; name: string; code: string }[];
  total: number;
  page: number;
  limit: number;
}

export function StockTransfersClient({
  initialTransfers,
  locations,
  total,
  page,
  limit,
}: StockTransfersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [selectedSource, setSelectedSource] = React.useState(searchParams.get("source") || "ALL");
  const [selectedDest, setSelectedDest] = React.useState(searchParams.get("destination") || "ALL");

  // View modal state
  const [viewTransfer, setViewTransfer] = React.useState<TransferItem | null>(null);

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
    router.push(`/store-management/transfers?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/store-management/transfers?${params.toString()}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-primary" /> Stock Transfers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inter-warehouse stock movements and transfers between storage locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store-management/transfers/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> New Stock Transfer
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by transfer number or location name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-input pl-9 pr-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  applyFilters({ source: e.target.value });
                }}
                className="h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Source Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    From: {loc.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDest}
                onChange={(e) => {
                  setSelectedDest(e.target.value);
                  applyFilters({ destination: e.target.value });
                }}
                className="h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Destinations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    To: {loc.name}
                  </option>
                ))}
              </select>

              <Button type="submit" variant="secondary" size="sm" className="h-9 gap-1 text-xs">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardContent className="p-0">
          {initialTransfers.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<ArrowRightLeft className="w-12 h-12" />}
                title="No stock transfers recorded"
                description="Move inventory safely between central warehouses, branch stores, and showrooms."
                action={
                  <Link href="/store-management/transfers/new">
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" /> New Stock Transfer
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                    <th className="px-4 py-3">Transfer #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">From (Source)</th>
                    <th className="px-4 py-3">To (Destination)</th>
                    <th className="px-4 py-3 text-center">Items Transferred</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialTransfers.map((trf) => {
                    const totalQty = trf.items.reduce(
                      (sum, item) => sum + Number(item.quantity),
                      0
                    );
                    return (
                      <tr key={trf.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-primary">
                          {trf.transferNumber}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(trf.transferDate)}
                        </td>

                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {trf.sourceLocation?.name}
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground ml-5">
                            {trf.sourceLocation?.code}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-primary shrink-0" />
                            {trf.destinationLocation?.name}
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground ml-5">
                            {trf.destinationLocation?.code}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded text-[11px] font-mono">
                            {trf.items.length} line(s) ({formatNumber(totalQty)} units)
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={trf.status} />
                        </td>

                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                          {trf.notes || "—"}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setViewTransfer(trf)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View Transfer Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} transfers
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="px-2 font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Detail Modal */}
      {viewTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-2xl w-full shadow-2xl">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-primary" /> Transfer #{viewTransfer.transferNumber}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Executed on {formatDate(viewTransfer.transferDate)}
                  </CardDescription>
                </div>
                <button
                  onClick={() => setViewTransfer(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Route banner */}
              <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Source Storage Location
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {viewTransfer.sourceLocation?.name}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px] block">
                    {viewTransfer.sourceLocation?.code}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Destination Location
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {viewTransfer.destinationLocation?.name}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px] block">
                    {viewTransfer.destinationLocation?.code}
                  </span>
                </div>
              </div>

              {viewTransfer.notes && (
                <div className="text-xs p-3 bg-card border border-border rounded-lg">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                    Notes
                  </span>
                  <p className="text-foreground">{viewTransfer.notes}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">Transferred Products</h4>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2 text-right">Quantity</th>
                        <th className="px-3 py-2">Line Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {viewTransfer.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-medium text-foreground">
                            {item.product?.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                            {item.product?.sku}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                            {formatNumber(Number(item.quantity))}{" "}
                            <span className="text-[10px] font-sans font-normal text-muted-foreground">
                              {item.product?.unit?.abbreviation || ""}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {item.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewTransfer(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

