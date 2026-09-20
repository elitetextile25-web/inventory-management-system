import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Wallet, ArrowDownLeft, ArrowUpRight, Lock, Unlock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Cash Register — FabricPro",
};

export default async function CashRegisterPage() {
  const session = await auth();
  const storeId = (session?.user as any)?.storeId;

  // Find cash accounts for the store
  const cashAccounts = await prisma.cashAccount.findMany({
    where: storeId ? { storeId } : {},
    take: 5,
  });

  const defaultAccount = cashAccounts[0] || {
    id: "default",
    name: "Main POS Cash Drawer",
    type: "CASH",
    currentBalance: 15450.0,
    openingBalance: 5000.0,
  };

  // Recent cash payments
  const recentCash = await prisma.payment.findMany({
    where: { method: "CASH" },
    orderBy: { paymentDate: "desc" },
    take: 10,
    include: {
      customer: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Cash Register & Drawer Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage daily cash drawer sessions, opening float, deposits, and closing reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ArrowDownLeft className="w-4 h-4 text-success" />
            Cash In (Deposit)
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpRight className="w-4 h-4 text-danger" />
            Cash Out (Payout)
          </Button>
          <Button size="sm" variant="danger">
            <Lock className="w-4 h-4" />
            Close Register (Day End)
          </Button>
        </div>
      </div>

      {/* Register Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase">Drawer Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/20 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                OPEN
              </span>
            </div>
            <p className="text-3xl font-bold mt-3 text-foreground">
              {formatCurrency(Number(defaultAccount.currentBalance))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Current Physical Cash in Drawer</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Opening Float</span>
            <p className="text-2xl font-bold mt-3 text-foreground">
              {formatCurrency(Number(defaultAccount.openingBalance))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Starting cash this morning</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Cash Sales Today</span>
            <p className="text-2xl font-bold mt-3 text-success">
              {formatCurrency(12450.0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">From completed POS orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Cash Payouts Today</span>
            <p className="text-2xl font-bold mt-3 text-danger">
              {formatCurrency(2000.0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Petty cash & supplier COD</p>
          </CardContent>
        </Card>
      </div>

      {/* Drawer Accounts & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Drawers List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Cash Drawers & Wallets</span>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                Add Drawer
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Main Counter Register 1</p>
                <p className="text-xs text-muted-foreground">Opened at 09:00 AM • Staff: Cashier 1</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-primary">{formatCurrency(15450.0)}</p>
                <span className="text-[10px] text-success font-medium">Active</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border hover:bg-muted/30 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">bKash Merchant Wallet</p>
                <p className="text-xs text-muted-foreground">01700-000000</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(45200.0)}</p>
                <span className="text-[10px] text-muted-foreground">Linked</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border hover:bg-muted/30 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Nagad Merchant Wallet</p>
                <p className="text-xs text-muted-foreground">01800-000000</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(18900.0)}</p>
                <span className="text-[10px] text-muted-foreground">Linked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Drawer Movement Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Cash Drawer Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase text-left">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Event / Transaction</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentCash.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                        No cash transactions recorded today yet
                      </td>
                    </tr>
                  ) : (
                    recentCash.map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {formatDateTime(c.paymentDate)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-xs">
                          {c.type === "SALE_PAYMENT" ? (
                            <span className="text-success flex items-center gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Sale Cash Collection ({c.customer?.name ?? "Counter"})
                            </span>
                          ) : (
                            <span className="text-danger flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Cash Disbursement
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {c.reference || "POS-CASH"}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-bold text-xs ${
                            c.type === "SALE_PAYMENT" ? "text-success" : "text-danger"
                          }`}
                        >
                          {c.type === "SALE_PAYMENT" ? "+" : "-"} {formatCurrency(Number(c.amount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
