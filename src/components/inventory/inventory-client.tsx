"use client";
import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Layers, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/utils";

export function InventoryClient({ products, total, page, pageSize, storeId }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [search, setSearch] = React.useState(sp.get("search") ?? "");
  const totalPages = Math.ceil(total / pageSize);

  const update = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  };

  const totalValue = products.reduce((sum: number, p: any) => {
    const qty = Number(p.inventoryBalances?.[0]?.quantity ?? 0);
    const cost = Number(p.inventoryBalances?.[0]?.averageCost ?? p.purchaseCost ?? 0);
    return sum + qty * cost;
  }, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">{total} active products · Stock value: {formatCurrency(totalValue)}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => router.push("/inventory/adjustments")}>
          Stock Adjustment
        </Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search products..." value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && update("search", search)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </CardContent></Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["Product","SKU","Category","Qty","Avg Cost","Stock Value","Min Stock","Status"].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${["Qty","Avg Cost","Stock Value","Min Stock"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<Layers className="w-12 h-12" />} title="No products found" /></td></tr>
              ) : products.map((p: any) => {
                const qty = Number(p.inventoryBalances?.[0]?.quantity ?? 0);
                const minStock = Number(p.minimumStock ?? 0);
                const avgCost = Number(p.inventoryBalances?.[0]?.averageCost ?? p.purchaseCost ?? 0);
                const stockValue = qty * avgCost;
                const status = qty <= 0 ? "OUT_OF_STOCK" : qty <= minStock ? "LOW_STOCK" : null;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                    <td className={`px-4 py-3 text-right font-bold ${qty <= 0 ? "text-danger" : qty <= minStock ? "text-warning" : "text-foreground"}`}>
                      {formatNumber(qty, 2)} {p.unit?.abbreviation}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(avgCost)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(stockValue)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(minStock, 0)} {p.unit?.abbreviation}</td>
                    <td className="px-4 py-3">
                      {status ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className={`w-3 h-3 ${status === "OUT_OF_STOCK" ? "text-danger" : "text-warning"}`} />
                          <StatusBadge status={status} />
                        </div>
                      ) : <span className="status-badge status-active">OK</span>}
                    </td>
                  </tr>
                );
              })}
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
