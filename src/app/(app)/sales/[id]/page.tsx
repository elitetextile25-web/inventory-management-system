import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Receipt,
  Calendar,
  User,
  Store,
  CreditCard,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { InvoicePrintButton } from "@/components/sales/invoice-print-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await prisma.sales.findUnique({ where: { id }, select: { invoiceNumber: true } });
  return { title: sale ? `Invoice ${sale.invoiceNumber} — FabricPro` : "Invoice — FabricPro" };
}

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;

  const sale = await prisma.sales.findFirst({
    where: { id },
    include: {
      customer: true,
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

  if (!sale) notFound();

  const totalMeters = sale.items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
                {sale.invoiceNumber}
              </h1>
              <StatusBadge status={sale.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Issued on {formatDate(sale.saleDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/sales/new">
            <Button variant="outline" size="sm">
              + New Invoice
            </Button>
          </Link>
          <InvoicePrintButton />
        </div>
      </div>

      {/* Printable Invoice Document */}
      <Card className="border-border shadow-lg p-6 sm:p-8 bg-card print:border-none print:shadow-none">
        {/* Document Header */}
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
              {sale.store?.name || "Main Fabric Store & Showroom"}
            </p>
            {sale.store?.address && (
              <p className="text-xs text-muted-foreground">{sale.store.address}</p>
            )}
            {sale.store?.phone && (
              <p className="text-xs text-muted-foreground">Phone: {sale.store.phone}</p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-2xl font-black tracking-wider text-primary uppercase font-mono">
              INVOICE
            </span>
            <p className="text-sm font-bold font-mono text-foreground mt-0.5">
              #{sale.invoiceNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Date: {formatDate(sale.saleDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              Payment Status: <span className="font-semibold text-foreground">{sale.status}</span>
            </p>
          </div>
        </div>

        {/* Bill To & Bill From */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border text-xs">
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Billed To
            </p>
            <p className="text-sm font-bold text-foreground">
              {sale.customer?.name || "Walk-in Retail Customer"}
            </p>
            {sale.customer?.phone && (
              <p className="text-muted-foreground mt-0.5">
                Phone: {sale.customer.phone}
              </p>
            )}
            {sale.customer?.address && (
              <p className="text-muted-foreground mt-0.5">
                Address: {sale.customer.address}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Order Details
            </p>
            <p className="text-muted-foreground">
              Channel: <span className="font-medium text-foreground">{sale.channel}</span>
            </p>
            <p className="text-muted-foreground mt-0.5">
              Total Fabrics: <span className="font-medium text-foreground">{sale.items.length} items</span>
            </p>
            <p className="text-muted-foreground mt-0.5">
              Total Measurement:{" "}
              <span className="font-semibold text-primary">
                {formatNumber(totalMeters, 2)} meters
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
                <th className="pb-3 min-w-[200px]">Fabric / Description</th>
                <th className="pb-3 text-right">Meters / Qty</th>
                <th className="pb-3 text-right">Rate (৳)</th>
                <th className="pb-3 text-right">Discount</th>
                <th className="pb-3 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sale.items.map((item, idx) => (
                <tr key={item.id} className="py-2.5">
                  <td className="py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="py-3 pr-2">
                    <p className="font-semibold text-foreground text-xs">
                      {item.productName}
                    </p>
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
                    {formatCurrency(Number(item.unitPrice))}
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

        {/* Totals & Payments Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-xs">
          <div>
            {sale.notes && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/70 mb-4">
                <p className="font-semibold text-foreground mb-1">Cutting & Notes:</p>
                <p className="text-muted-foreground">{sale.notes}</p>
              </div>
            )}

            {sale.payments.length > 0 && (
              <div>
                <p className="font-semibold text-foreground uppercase tracking-wider mb-2">
                  Payment History
                </p>
                <div className="space-y-1.5">
                  {sale.payments.map((p) => (
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
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium text-foreground">
                {formatCurrency(Number(sale.subtotal))}
              </span>
            </div>

            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between py-1 border-b border-border/40 text-emerald-600">
                <span>Special Discount:</span>
                <span>-{formatCurrency(Number(sale.discountAmount))}</span>
              </div>
            )}

            {Number(sale.taxAmount) > 0 && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Tax / VAT:</span>
                <span>{formatCurrency(Number(sale.taxAmount))}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-border text-sm font-bold bg-primary/5 px-2 rounded-lg">
              <span className="text-primary font-bold">Grand Total:</span>
              <span className="text-primary text-base font-extrabold">
                {formatCurrency(Number(sale.grandTotal))}
              </span>
            </div>

            <div className="flex justify-between py-1 text-success font-semibold">
              <span>Paid Amount:</span>
              <span>{formatCurrency(Number(sale.paidAmount))}</span>
            </div>

            {Number(sale.dueAmount) > 0 && (
              <div className="flex justify-between py-1 text-danger font-bold">
                <span>Due Balance:</span>
                <span>{formatCurrency(Number(sale.dueAmount))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="pt-8 mt-6 border-t border-border text-center text-[11px] text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-0.5">
            Fabric cuts once delivered cannot be returned unless manufacturing defect is present.
          </p>
        </div>
      </Card>
    </div>
  );
}
