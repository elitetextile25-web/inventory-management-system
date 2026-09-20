"use client";

import * as React from "react";
import {
  Printer,
  X,
  FileText,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThermalReceipt, ReceiptData } from "@/components/sales/thermal-receipt";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId?: string | null;
  initialSale?: ReceiptData | null;
}

export function ReceiptPrintModal({
  isOpen,
  onClose,
  saleId,
  initialSale,
}: ReceiptPrintModalProps) {
  const [sale, setSale] = React.useState<ReceiptData | null>(initialSale || null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [format, setFormat] = React.useState<"thermal" | "a4">("thermal");
  const [searchQuery, setSearchQuery] = React.useState("");
  const printContainerRef = React.useRef<HTMLDivElement>(null);

  const fetchSale = React.useCallback(async (idOrInv: string) => {
    if (!idOrInv) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/${encodeURIComponent(idOrInv)}`);
      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error(data.error || "Sale receipt not found");
      }
      setSale(data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load receipt details");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      if (initialSale) {
        setSale(initialSale);
        setError(null);
      } else if (saleId) {
        fetchSale(saleId);
      }
    }
  }, [isOpen, saleId, initialSale, fetchSale]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!printContainerRef.current) {
      window.print();
      return;
    }

    // Create a clean hidden iframe for isolated printing
    const printContent = printContainerRef.current.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt ${sale?.invoiceNumber || "Print"}</title>
            <style>
              @page {
                size: ${format === "thermal" ? "80mm auto" : "A4 portrait"};
                margin: ${format === "thermal" ? "4mm" : "15mm"};
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                color: #000;
                background: #fff;
                margin: 0;
                padding: 0;
              }
              * {
                box-sizing: border-box;
              }
              .border-dashed { border-style: dashed; }
              .border-b { border-bottom-width: 1px; }
              .border-t { border-top-width: 1px; }
              .border { border-width: 1px; }
              .border-gray-400 { border-color: #9ca3af; }
              .border-gray-300 { border-color: #d1d5db; }
              .border-black { border-color: #000; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .font-extrabold { font-weight: 800; }
              .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
              .uppercase { text-transform: uppercase; }
              .tracking-wider { letter-spacing: 0.05em; }
              .tracking-widest { letter-spacing: 0.1em; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .grid { display: grid; }
              .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
              .col-span-6 { grid-column: span 6 / span 6; }
              .col-span-3 { grid-column: span 3 / span 3; }
              .p-4 { padding: 1rem; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .pb-1 { padding-bottom: 0.25rem; }
              .pb-3 { padding-bottom: 0.75rem; }
              .pt-1 { padding-top: 0.25rem; }
              .pt-3 { padding-top: 0.75rem; }
              .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
              .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
              .mt-0\\.5 { margin-top: 0.125rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-1\\.5 { margin-top: 0.375rem; }
              .mb-1\\.5 { margin-bottom: 0.375rem; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[11px\\] { font-size: 11px; }
              .text-\\[12px\\] { font-size: 12px; }
              .text-\\[13px\\] { font-size: 13px; }
              .text-base { font-size: 1rem; }
              .text-xl { font-size: 1.25rem; }
              .text-2xl { font-size: 1.5rem; }
              .w-full { width: 100%; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 4px 6px; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Print Sales Receipt / Invoice
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Print previous day, previous year, or current receipts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Invoice Search & Format Switcher */}
        <div className="px-5 py-3 border-b border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Lookup Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) fetchSale(searchQuery.trim());
            }}
            className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Lookup any invoice # (e.g. INV-001)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs px-2.5">
              Lookup
            </Button>
          </form>

          {/* Format Selector */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border/60">
            <button
              onClick={() => setFormat("thermal")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                format === "thermal"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal Slip (80mm)</span>
            </button>
            <button
              onClick={() => setFormat("a4")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                format === "a4"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Invoice</span>
            </button>
          </div>
        </div>

        {/* Receipt Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/20 flex flex-col items-center justify-start min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center my-auto text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading receipt details...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center my-auto text-center max-w-sm gap-2 text-destructive">
              <AlertCircle className="w-8 h-8 opacity-80" />
              <p className="text-xs font-medium">{error}</p>
              <p className="text-[11px] text-muted-foreground">
                Please check the invoice number or select a sale from the sales list.
              </p>
            </div>
          ) : sale ? (
            <div className="w-full flex justify-center">
              <div ref={printContainerRef} className="w-full">
                {format === "thermal" ? (
                  <ThermalReceipt sale={sale} />
                ) : (
                  /* Clean A4 Invoice Representation */
                  <div className="bg-white text-black p-6 rounded-lg border border-gray-300 shadow-sm max-w-xl mx-auto text-xs font-sans">
                    <div className="flex justify-between items-start pb-4 border-b border-gray-300">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {sale.store?.name || "FabricPro Textiles"}
                        </h2>
                        <p className="text-gray-600 text-[11px]">
                          {sale.store?.address || "Main Showroom"}
                        </p>
                        {sale.store?.phone && (
                          <p className="text-gray-600 text-[11px]">
                            Tel: {sale.store.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-gray-900 tracking-wider">
                          INVOICE
                        </span>
                        <p className="font-mono font-bold text-gray-800">
                          #{sale.invoiceNumber}
                        </p>
                        <p className="text-gray-600 text-[11px]">
                          Date: {formatDate(sale.saleDate)}
                        </p>
                      </div>
                    </div>

                    <div className="py-4 border-b border-gray-300 grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                          Billed To:
                        </span>
                        <p className="font-semibold text-gray-900 text-sm">
                          {sale.customer?.name || "Walk-in Retail Buyer"}
                        </p>
                        {sale.customer?.phone && (
                          <p className="text-gray-600 text-[11px]">
                            Phone: {sale.customer.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                          Status:
                        </span>
                        <p className="font-semibold text-gray-900">
                          {sale.status}
                        </p>
                      </div>
                    </div>

                    <table className="w-full text-left my-4 text-xs">
                      <thead>
                        <tr className="border-b border-gray-300 text-gray-600 font-bold uppercase text-[10px]">
                          <th className="py-2">Fabric / Description</th>
                          <th className="py-2 text-right">Meters / Qty</th>
                          <th className="py-2 text-right">Unit Rate</th>
                          <th className="py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sale.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2">
                              <p className="font-semibold text-gray-900">
                                {item.productName}
                              </p>
                              {item.productSku && (
                                <p className="text-[10px] text-gray-500 font-mono">
                                  {item.productSku}
                                </p>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              {formatNumber(Number(item.quantity), 2)}{" "}
                              {item.product?.unit?.abbreviation || "m"}
                            </td>
                            <td className="py-2 text-right">
                              {formatCurrency(Number(item.unitPrice))}
                            </td>
                            <td className="py-2 text-right font-bold text-gray-900">
                              {formatCurrency(Number(item.lineTotal))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t border-gray-300 pt-3 flex justify-end">
                      <div className="w-52 space-y-1 text-[11px]">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(Number(sale.subtotal))}</span>
                        </div>
                        {Number(sale.discountAmount || 0) > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span>Discount:</span>
                            <span>-{formatCurrency(Number(sale.discountAmount))}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t border-gray-300">
                          <span>Grand Total:</span>
                          <span>{formatCurrency(Number(sale.grandTotal))}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Paid:</span>
                          <span>{formatCurrency(Number(sale.paidAmount))}</span>
                        </div>
                        {Number(sale.dueAmount || 0) > 0 && (
                          <div className="flex justify-between text-red-600 font-bold">
                            <span>Due:</span>
                            <span>{formatCurrency(Number(sale.dueAmount))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="my-auto text-center text-xs text-muted-foreground">
              Select or enter an invoice number to preview receipt
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-card">
          <div>
            {sale && (
              <a
                href={`/sales/${sale.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <span>View Full Invoice Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={!sale || loading}
              className="gap-2 shadow-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>Print {format === "thermal" ? "Thermal Slip" : "Invoice"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
