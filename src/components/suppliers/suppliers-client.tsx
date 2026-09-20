"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, Truck, Eye, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Avatar } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function SuppliersClient({ suppliers, total, page, pageSize }: any) {
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

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Suppliers</h1><p className="text-sm text-muted-foreground">{total} suppliers</p></div>
        <Button size="sm" asChild><Link href="/suppliers/new"><Plus className="w-4 h-4" />Add Supplier</Link></Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Name, company, phone..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && update("search", search)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </CardContent></Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["Supplier","Company","Phone","Email","Opening Bal.","Orders","Actions"].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${["Opening Bal.","Orders"].includes(h) ? "text-right" : h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {suppliers.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<Truck className="w-12 h-12" />} title="No suppliers found" action={<Button size="sm" asChild><Link href="/suppliers/new"><Plus className="w-4 h-4" />Add Supplier</Link></Button>} /></td></tr>
              ) : suppliers.map((s: any) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><span className="font-medium">{s.name}</span></div></td>
                  <td className="px-4 py-3 text-muted-foreground">{s.company ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(s.openingBalance)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{s._count.purchaseOrders}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild><Link href={`/suppliers/${s.id}`}><Eye className="w-4 h-4" /></Link></Button>
                      <Button variant="ghost" size="icon" asChild><Link href={`/suppliers/${s.id}/edit`}><Edit2 className="w-4 h-4" /></Link></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
