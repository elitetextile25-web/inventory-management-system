"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, Wallet, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ExpensesClient({ expenses, total, page, pageSize, categories }: any) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Expenses</h1><p className="text-sm text-muted-foreground">{total} records</p></div>
        <Button size="sm" asChild><Link href="/expenses/new"><Plus className="w-4 h-4" />Add Expense</Link></Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["Date","Category","Amount","Payment","Reference","Status","Actions"].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${h === "Amount" ? "text-right" : h === "Actions" || h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {expenses.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<Wallet className="w-12 h-12" />} title="No expenses found" action={<Button size="sm" asChild><Link href="/expenses/new"><Plus className="w-4 h-4" />Add Expense</Link></Button>} /></td></tr>
              ) : expenses.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(e.expenseDate)}</td>
                  <td className="px-4 py-3 font-medium">{e.category?.name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-danger">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-3">{e.paymentMethod.replace(/_/g," ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-center"><Button variant="ghost" size="icon" asChild><Link href={`/expenses/${e.id}`}><Eye className="w-4 h-4" /></Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
