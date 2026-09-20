"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  ReceiptText,
  Eye,
  Printer,
  Calendar,
  Filter,
  RotateCcw,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReceiptPrintModal } from "@/components/sales/receipt-print-modal";

interface SalesClientProps {
  sales: any[];
  total: number;
  page: number;
  pageSize: number;
  filters?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    year?: string;
    preset?: string;
  };
}

export function SalesClient({
  sales,
  total,
  page,
  pageSize,
  filters,
}: SalesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(filters?.search ?? "");
  const [selectedSaleForPrint, setSelectedSaleForPrint] = React.useState<any | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [showCustomDates, setShowCustomDates] = React.useState(
    Boolean(filters?.startDate || filters?.endDate)
  );

  const [startDate, setStartDate] = React.useState(filters?.startDate ?? "");
  const [endDate, setEndDate] = React.useState(filters?.endDate ?? "");

  const activePreset = filters?.preset || "all";

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePresetSelect = (preset: string) => {
    const now = new Date();
    if (preset === "all") {
      setShowCustomDates(false);
      updateFilters({
        preset: null,
        startDate: null,
        endDate: null,
        year: null,
      });
    } else if (preset === "today") {
      setShowCustomDates(false);
      const str = formatDateString(now);
      updateFilters({
        preset: "today",
        startDate: str,
        endDate: str,
        year: null,
      });
    } else if (preset === "yesterday") {
      setShowCustomDates(false);
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const str = formatDateString(yest);
      updateFilters({
        preset: "yesterday",
        startDate: str,
        endDate: str,
        year: null,
      });
    } else if (preset === "last_7") {
      setShowCustomDates(false);
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      updateFilters({
        preset: "last_7",
        startDate: formatDateString(past),
        endDate: formatDateString(now),
        year: null,
      });
    } else if (preset === "this_month") {
      setShowCustomDates(false);
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      updateFilters({
        preset: "this_month",
        startDate: formatDateString(firstDay),
        endDate: formatDateString(now),
        year: null,
      });
    } else if (preset === "this_year") {
      setShowCustomDates(false);
      const curYear = String(now.getFullYear());
      updateFilters({
        preset: "this_year",
        year: curYear,
        startDate: null,
        endDate: null,
      });
    } else if (preset === "last_year") {
      setShowCustomDates(false);
      const prevYear = String(now.getFullYear() - 1);
      updateFilters({
        preset: "last_year",
        year: prevYear,
        startDate: null,
        endDate: null,
      });
    } else if (preset === "custom") {
      setShowCustomDates(true);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handlePrintSale = (saleItem: any) => {
    setSelectedSaleForPrint(saleItem);
    setIsPrintModalOpen(true);
  };

  const handleOpenGeneralPrint = () => {
    setSelectedSaleForPrint(null);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sales & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {total} invoices total • Print receipts from today, yesterday, or previous years
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Print Any Receipt Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenGeneralPrint}
            className="gap-1.5 shadow-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Printer className="w-4 h-4" />
            <span>Print Any Receipt</span>
          </Button>

          <Button size="sm" variant="outline" asChild>
            <Link href="/pos">POS Mode</Link>
          </Button>

          <Button size="sm" asChild>
            <Link href="/sales/new">
              <Plus className="w-4 h-4" /> New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Date Selection Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          {/* Top Row: Search & Status */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search invoice number, customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && updateFilters({ search: search.trim() || null })
                }
                className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filters?.status || ""}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => updateFilters({ status: e.target.value || null })}
              >
                <option value="">All Statuses</option>
                {["DRAFT", "CONFIRMED", "PARTIALLY_PAID", "PAID", "COMPLETED", "VOIDED"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  )
                )}
              </select>

              {(filters?.search ||
                filters?.status ||
                filters?.startDate ||
                filters?.endDate ||
                filters?.year ||
                activePreset !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setStartDate("");
                    setEndDate("");
                    setShowCustomDates(false);
                    router.push(pathname);
                  }}
                  className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Row: Date Presets for Previous Days & Years */}
          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mr-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Period:</span>
              </span>

              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "last_7", label: "Last 7 Days" },
                { id: "this_month", label: "This Month" },
                { id: "this_year", label: `This Year (${new Date().getFullYear()})` },
                { id: "last_year", label: `Prev Year (${new Date().getFullYear() - 1})` },
                { id: "custom", label: "Custom Range..." },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    activePreset === p.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs if selected */}
            {showCustomDates && (
              <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs px-2.5"
                  onClick={() =>
                    updateFilters({
                      preset: "custom",
                      startDate: startDate || null,
                      endDate: endDate || null,
                      year: null,
                    })
                  }
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Invoices Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Invoice #",
                  "Customer",
                  "Date & Time",
                  "Fabrics / Cuts",
                  "Total",
                  "Paid",
                  "Due",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                      h === "Total" || h === "Paid" || h === "Due"
                        ? "text-right"
                        : h === "Status"
                        ? "text-center"
                        : h === "Actions"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={<ReceiptText className="w-12 h-12" />}
                      title="No sales found for this period"
                      description="Try selecting 'All Time' or a different date range, or create a new invoice."
                      action={
                        <Button size="sm" asChild>
                          <Link href="/sales/new">
                            <Plus className="w-4 h-4" /> New Invoice
                          </Link>
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                sales.map((s) => {
                  const itemsCount = s.items?.length || 0;
                  const totalMeters = s.items?.reduce(
                    (sum: number, i: any) => sum + Number(i.quantity || 0),
                    0
                  ) || 0;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Invoice Number */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/sales/${s.id}`}
                          className="font-mono text-xs font-bold text-primary hover:underline"
                        >
                          {s.invoiceNumber}
                        </Link>
                        {s.channel && (
                          <span className="block text-[10px] text-muted-foreground font-sans uppercase">
                            {s.channel}
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs">
                          {s.customer?.name ?? "Walk-in Retail Customer"}
                        </p>
                        {s.customer?.phone && (
                          <p className="text-[10px] text-muted-foreground">
                            {s.customer.phone}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(s.saleDate)}
                      </td>

                      {/* Items / Cuts */}
                      <td className="px-4 py-3 text-xs">
                        {itemsCount > 0 ? (
                          <span className="font-medium text-foreground">
                            {totalMeters.toFixed(1)}m{" "}
                            <span className="text-muted-foreground font-normal">
                              ({itemsCount} {itemsCount === 1 ? "cut" : "cuts"})
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Amounts */}
                      <td className="px-4 py-3 text-right font-bold text-foreground text-xs">
                        {formatCurrency(s.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-success text-xs font-semibold">
                        {formatCurrency(s.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-danger text-xs font-semibold">
                        {Number(s.dueAmount) > 0 ? formatCurrency(s.dueAmount) : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={s.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print Receipt Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/10 shadow-2xs"
                            title="Print Receipt"
                            onClick={() => handlePrintSale(s)}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </Button>

                          {/* View Invoice */}
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="View Details"
                          >
                            <Link href={`/sales/${s.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing page {page} of {totalPages} ({total} invoices)
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Global & Row-Level Receipt Print Modal */}
      <ReceiptPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedSaleForPrint(null);
        }}
        saleId={selectedSaleForPrint?.id}
        initialSale={selectedSaleForPrint}
      />
    </div>
  );
}
