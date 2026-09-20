"use client";

import * as React from "react";
import { Printer, Receipt, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptPrintModal } from "@/components/sales/receipt-print-modal";
import Link from "next/link";

export function InvoicePrintButton({
  saleId,
  initialSale,
}: {
  saleId?: string;
  initialSale?: any;
}) {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shadow-2xs border-primary/20 text-primary hover:bg-primary/10"
          onClick={() => setModalOpen(true)}
        >
          <Receipt className="w-4 h-4" />
          <span>Print Thermal Slip</span>
        </Button>

        <Button
          size="sm"
          className="gap-1.5 shadow-2xs"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          <span>Print A4 Invoice</span>
        </Button>
      </div>

      <ReceiptPrintModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        saleId={saleId}
        initialSale={initialSale}
      />
    </>
  );
}
