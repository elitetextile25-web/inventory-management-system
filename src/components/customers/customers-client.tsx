"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search, Users, Eye, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Avatar } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function CustomersClient({ customers, total, page, pageSize }: any) {
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
        <div><h1 className="text-2xl font-bold">Customers</h1><p className="text-sm text-muted-foreground">{total} customers</p></div>
        <Button size="sm" asChild><Link href="/customers/new"><Plus className="w-4 h-4" />Add Customer</Link></Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Name, phone, email..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && update("search", search)}
            className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </CardContent></Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["Customer","Phone","Email","Credit Limit","Opening Bal.","Sales","Actions"].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${["Credit Limit","Opening Bal.","Sales"].includes(h) ? "text-right" : h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {customers.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<Users className="w-12 h-12" />} title="No customers found" action={<Button size="sm" asChild><Link href="/customers/new"><Plus className="w-4 h-4" />Add Customer</Link></Button>} /></td></tr>
              ) : customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.creditLimit)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.openingBalance)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c._count.sales}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild><Link href={`/customers/${c.id}`}><Eye className="w-4 h-4" /></Link></Button>
                      <Button variant="ghost" size="icon" asChild><Link href={`/customers/${c.id}/edit`}><Edit2 className="w-4 h-4" /></Link></Button>
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
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update("page", String(page - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => update("page", String(page + 1))}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
