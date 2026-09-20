"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, ReceiptText, Eye, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function SalesClient({
  sales, total, page, pageSize,
}: {
  sales: any[]; total: number; page: number; pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");

  const updateSearch = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-sm text-muted-foreground">{total} invoices</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/pos">POS Mode</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sales/new"><Plus className="w-4 h-4" /> New Invoice</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text" placeholder="Invoice number, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateSearch("search", search)}
                className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => updateSearch("status", e.target.value)}
            >
              <option value="">All Status</option>
              {["DRAFT","CONFIRMED","PARTIALLY_PAID","PAID","COMPLETED","VOIDED"].map(s => (
                <option key={s} value={s}>{s.replace(/_/g," ")}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Invoice #","Customer","Date","Total","Paid","Due","Status","Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${h === "Total" || h === "Paid" || h === "Due" ? "text-right" : h === "Status" ? "text-center" : h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={<ReceiptText className="w-12 h-12" />} title="No sales found" description="Create your first invoice or sale." action={<Button size="sm" asChild><Link href="/sales/new"><Plus className="w-4 h-4" />New Invoice</Link></Button>} />
                </td></tr>
              ) : sales.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{s.invoiceNumber}</td>
                  <td className="px-4 py-3">{s.customer?.name ?? "Walk-in"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.saleDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(s.grandTotal)}</td>
                  <td className="px-4 py-3 text-right text-success">{formatCurrency(s.paidAmount)}</td>
                  <td className="px-4 py-3 text-right text-danger">{formatCurrency(s.dueAmount)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild><Link href={`/sales/${s.id}`} title="View"><Eye className="w-4 h-4" /></Link></Button>
                      <Button variant="ghost" size="icon" title="Print"><Printer className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateSearch("page", String(page - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateSearch("page", String(page + 1))}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
