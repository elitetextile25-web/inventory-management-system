"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, ShoppingCart, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PurchasesClient({ purchases, total, page, pageSize }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const totalPages = Math.ceil(total / pageSize);

  const update = (k: string, v: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (v) p.set(k, v); else p.delete(k);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Purchases</h1><p className="text-sm text-muted-foreground">{total} orders</p></div>
        <Button size="sm" asChild><Link href="/purchases/new"><Plus className="w-4 h-4" />New Purchase</Link></Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Order number, supplier..." value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && update("search", search)}
              className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm" onChange={e => update("status", e.target.value)}>
            <option value="">All Status</option>
            {["DRAFT","ORDERED","PARTIALLY_RECEIVED","RECEIVED","PARTIALLY_PAID","PAID","CLOSED","CANCELLED"].map(s => (
              <option key={s} value={s}>{s.replace(/_/g," ")}</option>
            ))}
          </select>
        </div>
      </CardContent></Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["Order #","Supplier","Date","Total","Paid","Due","Status","Actions"].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${["Total","Paid","Due"].includes(h) ? "text-right" : h === "Status" ? "text-center" : h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {purchases.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<ShoppingCart className="w-12 h-12" />} title="No purchases found" action={<Button size="sm" asChild><Link href="/purchases/new"><Plus className="w-4 h-4" />New Purchase</Link></Button>} /></td></tr>
              ) : purchases.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{p.orderNumber}</td>
                  <td className="px-4 py-3">{p.supplier?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.orderDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.grandTotal)}</td>
                  <td className="px-4 py-3 text-right text-success">{formatCurrency(p.paidAmount)}</td>
                  <td className="px-4 py-3 text-right text-danger">{formatCurrency(p.dueAmount)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon" asChild><Link href={`/purchases/${p.id}`}><Eye className="w-4 h-4" /></Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update("page", String(page - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => update("page", String(page + 1))}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
