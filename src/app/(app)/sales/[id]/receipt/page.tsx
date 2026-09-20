import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThermalReceipt } from "@/components/sales/thermal-receipt";
import { InvoicePrintButton } from "@/components/sales/invoice-print-button";
import { serializeData } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await prisma.sales.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
    select: { invoiceNumber: true },
  });
  return {
    title: sale ? `Receipt ${sale.invoiceNumber} — FabricPro` : "Receipt — FabricPro",
  };
}

export default async function SaleReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;
  const sp = await searchParams;
  const format = sp.format || "thermal";

  const sale = await prisma.sales.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
    include: {
      customer: true,
      store: true,
      salesperson: {
        select: { id: true, name: true, email: true },
      },
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

  const serializedSale = serializeData(sale);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-6 px-4">
      {/* Action Header - hidden in print */}
      <div className="max-w-md mx-auto mb-6 flex items-center justify-between gap-3 no-print">
        <Link
          href={`/sales/${sale.id}`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoice</span>
        </Link>

        <div className="flex items-center gap-2">
          <InvoicePrintButton saleId={sale.id} initialSale={serializedSale} />
        </div>
      </div>

      {/* The Printable Thermal Receipt */}
      <div className="flex justify-center">
        <ThermalReceipt sale={serializedSale} />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print, header, nav, aside {
              display: none !important;
            }
            body {
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `
      }} />
    </div>
  );
}
