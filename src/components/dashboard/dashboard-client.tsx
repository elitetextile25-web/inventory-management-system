"use client";

import * as React from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, Wallet,
  Users, Package, AlertTriangle, ArrowUpRight, ArrowDownRight,
  ReceiptText, Truck, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface KPI {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: React.ElementType;
  gradient: string;
}

const DUMMY_TREND = [
  { month: "Apr", sales: 42000, purchases: 28000 },
  { month: "May", sales: 55000, purchases: 35000 },
  { month: "Jun", sales: 47000, purchases: 30000 },
  { month: "Jul", sales: 63000, purchases: 41000 },
  { month: "Aug", sales: 71000, purchases: 45000 },
  { month: "Sep", sales: 58000, purchases: 38000 },
];

const DUMMY_LOW_STOCK = [
  { name: "Pure Silk Chiffon 58\" (Blush Rose)", sku: "FAB-CHF-005", quantity: 6.5, minimumStock: 25 },
  { name: "Heavy Twill Denim 14.5oz (Indigo)", sku: "FAB-DNM-004", quantity: 12.0, minimumStock: 30 },
  { name: "Royal Micro Velvet 58\" (Navy)", sku: "FAB-VLV-006", quantity: 4.0, minimumStock: 15 },
  { name: "Banarasi Zari Brocade Silk", sku: "FAB-BRC-007", quantity: 2.5, minimumStock: 10 },
  { name: "Pure Belgian Linen Chambray", sku: "FAB-LIN-003", quantity: 8.0, minimumStock: 20 },
];

const DUMMY_RECENT_SALES = [
  { invoiceNumber: "INV-000001", customer: "Zara Bridal & Couture Studio", saleDate: new Date(), grandTotal: 28500, status: "PAID" },
  { invoiceNumber: "INV-000002", customer: "Master Tailors & Cutters", saleDate: new Date(), grandTotal: 14200, status: "PARTIALLY_PAID" },
  { invoiceNumber: "INV-000003", customer: "Walk-in Retail Buyer (3.5m Cotton)", saleDate: new Date(), grandTotal: 1470, status: "PAID" },
  { invoiceNumber: "INV-000004", customer: "Elegance Fashion Boutique", saleDate: new Date(), grandTotal: 52000, status: "CONFIRMED" },
  { invoiceNumber: "INV-000005", customer: "Elite Apparel Studio", saleDate: new Date(), grandTotal: 8900, status: "PAID" },
];

export function DashboardClient({ data }: { data: any }) {
  const kpis = data?.kpis ?? {
    salesToday: 58750, salesMonth: 342600, salesYear: 2840000,
    purchasesMonth: 198400, expensesMonth: 45200, receivables: 86500,
    payables: 34200, grossProfit: 102780, netProfit: 57580,
    customersCount: 284, suppliersCount: 47, salesTodayCount: 23,
  };

  const lowStock = data?.lowStockProducts ?? DUMMY_LOW_STOCK;
  const recentSales = data?.recentSales ?? DUMMY_RECENT_SALES;
  const trend = data?.monthlySalesTrend?.length ? data.monthlySalesTrend : DUMMY_TREND;

  const KPICards: KPI[] = [
    {
      label: "Today's Sales",
      value: formatCurrency(kpis.salesToday),
      change: `${kpis.salesTodayCount} orders`,
      changePositive: true,
      icon: ReceiptText,
      gradient: "kpi-gradient-blue",
    },
    {
      label: "Month Sales",
      value: formatCurrency(kpis.salesMonth),
      change: "+12.3%",
      changePositive: true,
      icon: TrendingUp,
      gradient: "kpi-gradient-green",
    },
    {
      label: "Gross Profit",
      value: formatCurrency(kpis.grossProfit),
      change: "30% margin",
      changePositive: true,
      icon: DollarSign,
      gradient: "kpi-gradient-purple",
    },
    {
      label: "Net Profit",
      value: formatCurrency(kpis.netProfit),
      change: "+8.1%",
      changePositive: true,
      icon: TrendingUp,
      gradient: "kpi-gradient-teal",
    },
    {
      label: "Purchases",
      value: formatCurrency(kpis.purchasesMonth),
      change: "This month",
      changePositive: false,
      icon: ShoppingCart,
      gradient: "kpi-gradient-orange",
    },
    {
      label: "Expenses",
      value: formatCurrency(kpis.expensesMonth),
      change: "This month",
      changePositive: false,
      icon: Wallet,
      gradient: "kpi-gradient-red",
    },
    {
      label: "Receivables",
      value: formatCurrency(kpis.receivables),
      change: "Outstanding",
      changePositive: false,
      icon: Clock,
      gradient: "kpi-gradient-pink",
    },
    {
      label: "Payables",
      value: formatCurrency(kpis.payables),
      change: "To suppliers",
      changePositive: false,
      icon: Truck,
      gradient: "kpi-gradient-indigo",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your business performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPICards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`relative overflow-hidden rounded-xl p-4 text-white ${kpi.gradient} shadow-card`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium">{kpi.label}</p>
                  <p className="text-xl font-bold mt-1 leading-tight">{kpi.value}</p>
                  {kpi.change && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {kpi.changePositive ? (
                        <ArrowUpRight className="w-3 h-3 text-white/80" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-white/80" />
                      )}
                      <span className="text-xs text-white/80">{kpi.change}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales vs Purchases Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sales vs Purchases Trend
              <span className="text-xs font-normal text-muted-foreground">Last 6 months</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: any) => [`৳${Number(v ?? 0).toLocaleString()}`, ""]}
                  contentStyle={{ background: "hsl(var(--color-card))", border: "1px solid hsl(var(--color-border))", borderRadius: 8 }}
                />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" fill="url(#salesGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#f59e0b" fill="url(#purchaseGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {lowStock.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[140px]">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${Number(item.quantity) <= 0 ? "text-danger" : "text-warning"}`}>
                      {Number(item.quantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {Number(item.minimumStock)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentSales.map((sale: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg kpi-gradient-blue flex items-center justify-center shrink-0">
                      <ReceiptText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{sale.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{sale.customer?.name ?? sale.customer ?? "Walk-in"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(sale.grandTotal)}</p>
                    <StatusBadge status={sale.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Boutiques & Tailors", value: kpis.customersCount, icon: Users, color: "text-blue-500" },
                { label: "Textile Mills & Suppliers", value: kpis.suppliersCount, icon: Truck, color: "text-orange-500" },
                { label: "Year Fabric Revenue", value: formatCurrency(kpis.salesYear), icon: TrendingUp, color: "text-green-500" },
                { label: "Month Mill Purchases", value: formatCurrency(kpis.purchasesMonth), icon: ShoppingCart, color: "text-purple-500" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${s.color}`} />
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{s.value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
