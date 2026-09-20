"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, DollarSign, ArrowDownLeft, ArrowUpRight, Wallet, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentsClientProps {
  payments: any[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    totalReceived: number;
    totalPaid: number;
  };
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; isInflow: boolean }> = {
  SALE_PAYMENT: { label: "Sale Received", icon: ArrowDownLeft, color: "text-success", isInflow: true },
  PURCHASE_PAYMENT: { label: "Supplier Paid", icon: ArrowUpRight, color: "text-danger", isInflow: false },
  EXPENSE_PAYMENT: { label: "Expense Paid", icon: ArrowUpRight, color: "text-danger", isInflow: false },
  REFUND: { label: "Refund Issued", icon: ArrowUpRight, color: "text-amber-500", isInflow: false },
  OPENING_BALANCE: { label: "Opening Balance", icon: Wallet, color: "text-blue-500", isInflow: true },
  ADJUSTMENT: { label: "Adjustment", icon: DollarSign, color: "text-muted-foreground", isInflow: true },
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK: "Bank Transfer",
  CARD: "Credit/Debit Card",
  MOBILE_BANKING: "bKash / Nagad",
  CHEQUE: "Cheque",
  ACCOUNT_CREDIT: "Account Credit",
  OTHER: "Other",
};

export function PaymentsClient({ payments, total, page, pageSize, stats }: PaymentsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [typeFilter, setTypeFilter] = React.useState(searchParams.get("type") ?? "");
  const [methodFilter, setMethodFilter] = React.useState(searchParams.get("method") ?? "");

  const totalPages = Math.ceil(total / pageSize);

  const applyFilters = (newSearch?: string, newType?: string, newMethod?: string) => {
    const params = new URLSearchParams(searchParams);
    const s = newSearch !== undefined ? newSearch : search;
    const t = newType !== undefined ? newType : typeFilter;
    const m = newMethod !== undefined ? newMethod : methodFilter;

    if (s) params.set("search", s); else params.delete("search");
    if (t) params.set("type", t); else params.delete("type");
    if (m) params.set("method", m); else params.delete("method");

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Payments & Receipts
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete transaction ledger across cash, bank, and mobile wallets ({total} entries)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/payments/cash")}>
            <Wallet className="w-4 h-4" />
            Cash Register
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Collections (In)</p>
              <p className="text-2xl font-bold text-success mt-1">{formatCurrency(stats.totalReceived)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Disbursements (Out)</p>
              <p className="text-2xl font-bold text-danger mt-1">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-danger" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Net Cash Flow</p>
              <p className={`text-2xl font-bold mt-1 ${stats.totalReceived - stats.totalPaid >= 0 ? "text-primary" : "text-danger"}`}>
                {formatCurrency(stats.totalReceived - stats.totalPaid)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reference, customer, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              applyFilters(undefined, e.target.value, undefined);
            }}
            aria-label="Filter by Type"
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="SALE_PAYMENT">Customer Collection</option>
            <option value="PURCHASE_PAYMENT">Supplier Payment</option>
            <option value="EXPENSE_PAYMENT">Expense Payment</option>
            <option value="REFUND">Refund</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              applyFilters(undefined, undefined, e.target.value);
            }}
            aria-label="Filter by Payment Method"
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="CARD">Card</option>
            <option value="MOBILE_BANKING">bKash / Nagad</option>
          </select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Party / Beneficiary</th>
                <th className="px-4 py-3">Reference / Trx ID</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p: any) => {
                  const typeConf = TYPE_CONFIG[p.type] || {
                    label: p.type,
                    icon: DollarSign,
                    color: "text-foreground",
                    isInflow: true,
                  };
                  const Icon = typeConf.icon;
                  const party = p.customer?.name ?? p.supplier?.name ?? "General / Counter";
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Icon className={`w-4 h-4 shrink-0 ${typeConf.color}`} />
                          <span>{typeConf.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{party}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.reference || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted font-medium">
                          {METHOD_LABELS[p.method] || p.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.cashAccount?.name ?? "Default Drawer"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.paymentDate)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${typeConf.isInflow ? "text-success" : "text-danger"}`}>
                        {typeConf.isInflow ? "+" : "-"} {formatCurrency(Number(p.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages} ({total} records)
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
