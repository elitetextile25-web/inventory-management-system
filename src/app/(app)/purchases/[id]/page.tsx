import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Calendar,
  Building2,
  Package,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { InvoicePrintButton } from "@/components/sales/invoice-print-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.purchaseOrder.findUnique({ where: { id }, select: { orderNumber: true } });
  return { title: order ? `PO ${order.orderNumber} — FabricPro` : "Purchase Order — FabricPro" };
}

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const order = await prisma.purchaseOrder.findFirst({
    where: { id },
    include: {
      supplier: true,
      store: true,
      items: {
        include: {
          product: {
            include: { unit: true },
          },
        },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!order) notFound();

  const totalQty = order.items.reduce((s, i) => s + Number(i.quantity), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Created on {formatDate(order.orderDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/purchases/new">
            <Button variant="outline" size="sm">
              + New Purchase
            </Button>
          </Link>
          <InvoicePrintButton />
        </div>
      </div>

      {/* PO Document Card */}
      <Card className="border-border shadow-lg p-6 sm:p-8 bg-card print:border-none print:shadow-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-border gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
                FP
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                FabricPro
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Purchase Order & Delivery Receipt
            </p>
            {order.store?.name && (
              <p className="text-xs text-muted-foreground">Store: {order.store.name}</p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-2xl font-black tracking-wider text-primary uppercase font-mono">
              PURCHASE ORDER
            </span>
            <p className="text-sm font-bold font-mono text-foreground mt-0.5">
              #{order.orderNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Date: {formatDate(order.orderDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              Status: <span className="font-semibold text-foreground">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Supplier & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border text-xs">
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Supplier & Mill
            </p>
            <p className="text-sm font-bold text-foreground">{order.supplier.name}</p>
            {order.supplier.company && (
              <p className="text-muted-foreground mt-0.5">{order.supplier.company}</p>
            )}
            {order.supplier.phone && (
              <p className="text-muted-foreground mt-0.5">Phone: {order.supplier.phone}</p>
            )}
            {order.supplier.address && (
              <p className="text-muted-foreground mt-0.5">Address: {order.supplier.address}</p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Shipping & Delivery
            </p>
            <p className="text-muted-foreground">
              Deliver To:{" "}
              <span className="font-medium text-foreground">
                {order.store?.name || "Main Warehouse"}
              </span>
            </p>
            <p className="text-muted-foreground mt-0.5">
              Expected Date:{" "}
              <span className="font-medium text-foreground">
                {order.expectedDate ? formatDate(order.expectedDate) : "Standard Delivery"}
              </span>
            </p>
            <p className="text-muted-foreground mt-0.5">
              Total Quantity:{" "}
              <span className="font-semibold text-primary">
                {formatNumber(totalQty, 2)} units
              </span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6 border-b border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase font-semibold text-left">
                <th className="pb-3">#</th>
                <th className="pb-3 min-w-[200px]">Product / Fabric Description</th>
                <th className="pb-3 text-right">Quantity</th>
                <th className="pb-3 text-right">Cost Rate (৳)</th>
                <th className="pb-3 text-right">Discount</th>
                <th className="pb-3 text-right">Total (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {order.items.map((item, idx) => (
                <tr key={item.id} className="py-2.5">
                  <td className="py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="py-3 pr-2">
                    <p className="font-semibold text-foreground text-xs">{item.productName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      SKU: {item.productSku}
                    </p>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatNumber(Number(item.quantity), 2)}{" "}
                    <span className="text-muted-foreground">
                      {item.product?.unit?.abbreviation || "m"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {formatCurrency(Number(item.unitCost))}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {Number(item.discountAmount) > 0
                      ? formatCurrency(Number(item.discountAmount))
                      : "—"}
                  </td>
                  <td className="py-3 text-right font-bold text-foreground">
                    {formatCurrency(Number(item.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-xs">
          <div>
            {order.notes && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/70 mb-4">
                <p className="font-semibold text-foreground mb-1">Notes & Transport:</p>
                <p className="text-muted-foreground">{order.notes}</p>
              </div>
            )}

            {order.payments.length > 0 && (
              <div>
                <p className="font-semibold text-foreground uppercase tracking-wider mb-2">
                  Payment Vouchers
                </p>
                <div className="space-y-1.5">
                  {order.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px]"
                    >
                      <div>
                        <span className="font-medium text-foreground">{p.method}</span>
                        <span className="text-muted-foreground ml-2">
                          {formatDateTime(p.paymentDate)}
                        </span>
                      </div>
                      <span className="font-bold text-success">
                        {formatCurrency(Number(p.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 sm:max-w-xs sm:ml-auto">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Items Subtotal:</span>
              <span className="font-medium text-foreground">
                {formatCurrency(Number(order.subtotal))}
              </span>
            </div>

            {Number(order.shippingCost) > 0 && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Shipping / Freight:</span>
                <span>{formatCurrency(Number(order.shippingCost))}</span>
              </div>
            )}

            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between py-1 border-b border-border/40 text-emerald-600">
                <span>Supplier Discount:</span>
                <span>-{formatCurrency(Number(order.discountAmount))}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-border text-sm font-bold bg-primary/5 px-2 rounded-lg">
              <span className="text-primary font-bold">Grand Total:</span>
              <span className="text-primary text-base font-extrabold">
                {formatCurrency(Number(order.grandTotal))}
              </span>
            </div>

            <div className="flex justify-between py-1 text-success font-semibold">
              <span>Paid to Supplier:</span>
              <span>{formatCurrency(Number(order.paidAmount))}</span>
            </div>

            {Number(order.dueAmount) > 0 && (
              <div className="flex justify-between py-1 text-danger font-bold">
                <span>Accounts Payable (Due):</span>
                <span>{formatCurrency(Number(order.dueAmount))}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
