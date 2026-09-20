"use client";

import * as React from "react";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";

export interface ReceiptData {
  id: string;
  invoiceNumber: string;
  saleDate: string | Date;
  status: string;
  subtotal: number | string | any;
  discountAmount?: number | string | any;
  taxAmount?: number | string | any;
  grandTotal: number | string | any;
  paidAmount: number | string | any;
  dueAmount: number | string | any;
  channel?: string;
  notes?: string | null;
  store?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  customer?: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  salesperson?: {
    name?: string | null;
  } | null;
  items: Array<{
    id?: string;
    productName: string;
    productSku?: string;
    quantity: number | string | any;
    unitPrice: number | string | any;
    discountAmount?: number | string | any;
    lineTotal: number | string | any;
    product?: {
      unit?: {
        abbreviation?: string | null;
      } | null;
    } | null;
  }>;
  payments?: Array<{
    id: string;
    method: string;
    amount: number | string | any;
    paymentDate: string | Date;
  }>;
}

export function ThermalReceipt({
  sale,
  compact = false,
}: {
  sale: ReceiptData;
  compact?: boolean;
}) {
  const totalMeters = sale.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <div
      className={`bg-white text-black font-mono text-[12px] leading-tight p-4 mx-auto select-text ${
        compact ? "max-w-[280px]" : "max-w-[340px]"
      }`}
      style={{
        boxShadow: "0 0 10px rgba(0,0,0,0.08)",
        color: "#111",
      }}
    >
      {/* Receipt Header */}
      <div className="text-center pb-3 border-b border-dashed border-gray-400">
        <h2 className="text-base font-extrabold uppercase tracking-wider">
          {sale.store?.name || "FABRICPRO TEXTILES"}
        </h2>
        <p className="text-[11px] text-gray-700 mt-0.5">
          {sale.store?.address || "Main Fabric & Cloth Market"}
        </p>
        {sale.store?.phone && (
          <p className="text-[11px] text-gray-700">Phone: {sale.store.phone}</p>
        )}
        <div className="mt-1.5 inline-block border border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
          CASH RECEIPT / INVOICE
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Invoice:</span>
          <span className="font-bold text-black">{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span>{formatDateTime(sale.saleDate)}</span>
        </div>
        {sale.salesperson?.name && (
          <div className="flex justify-between">
            <span className="text-gray-600">Cashier / Staff:</span>
            <span>{sale.salesperson.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Customer:</span>
          <span className="font-semibold text-right truncate max-w-[170px]">
            {sale.customer?.name || "Walk-in Retail Buyer"}
          </span>
        </div>
        {sale.customer?.phone && (
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span>{sale.customer.phone}</span>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="py-2.5 border-b border-dashed border-gray-400">
        <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-gray-600 pb-1 border-b border-gray-300 mb-1.5">
          <span className="col-span-6">Fabric / Item</span>
          <span className="col-span-3 text-right">Cut/Rate</span>
          <span className="col-span-3 text-right">Amount</span>
        </div>

        <div className="space-y-2">
          {sale.items.map((item, idx) => {
            const unit = item.product?.unit?.abbreviation || "m";
            const qty = Number(item.quantity);
            const rate = Number(item.unitPrice);
            const total = Number(item.lineTotal);

            return (
              <div key={item.id || idx} className="text-[11px]">
                <div className="font-semibold leading-snug">
                  {idx + 1}. {item.productName}
                </div>
                {item.productSku && (
                  <div className="text-[10px] text-gray-500">
                    SKU: {item.productSku}
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-800 mt-0.5">
                  <span className="text-[10px]">
                    {formatNumber(qty, 2)} {unit} × {formatCurrency(rate)}
                  </span>
                  <span className="font-bold text-black">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary / Totals */}
      <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
        <div className="flex justify-between text-gray-700">
          <span>Total Fabric Cut:</span>
          <span className="font-semibold">{formatNumber(totalMeters, 2)} meters</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span>{formatCurrency(Number(sale.subtotal))}</span>
        </div>

        {Number(sale.discountAmount || 0) > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>Special Discount:</span>
            <span>-{formatCurrency(Number(sale.discountAmount))}</span>
          </div>
        )}

        {Number(sale.taxAmount || 0) > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>Tax / VAT:</span>
            <span>+{formatCurrency(Number(sale.taxAmount))}</span>
          </div>
        )}

        <div className="flex justify-between text-[13px] font-extrabold pt-1 border-t border-gray-400 text-black">
          <span>NET TOTAL:</span>
          <span>{formatCurrency(Number(sale.grandTotal))}</span>
        </div>

        <div className="flex justify-between pt-1">
          <span className="text-gray-700">Amount Paid:</span>
          <span className="font-bold text-black">
            {formatCurrency(Number(sale.paidAmount))}
          </span>
        </div>

        {Number(sale.dueAmount || 0) > 0 && (
          <div className="flex justify-between text-red-600 font-bold">
            <span>Balance Due:</span>
            <span>{formatCurrency(Number(sale.dueAmount))}</span>
          </div>
        )}

        {Number(sale.paidAmount) > Number(sale.grandTotal) && (
          <div className="flex justify-between text-green-700 font-semibold">
            <span>Change Returned:</span>
            <span>
              {formatCurrency(Number(sale.paidAmount) - Number(sale.grandTotal))}
            </span>
          </div>
        )}

        {sale.payments && sale.payments.length > 0 && (
          <div className="text-[10px] text-gray-600 pt-1">
            Paid via: {sale.payments.map((p) => p.method).join(", ")}
          </div>
        )}
      </div>

      {/* Notes if any */}
      {sale.notes && (
        <div className="py-2 border-b border-dashed border-gray-400 text-[10px] text-gray-600 italic">
          Note: {sale.notes}
        </div>
      )}

      {/* Barcode / Footer */}
      <div className="text-center pt-3 space-y-1.5">
        <div className="tracking-[4px] font-mono text-[11px] font-bold py-1 bg-gray-100 border border-gray-300 inline-block px-3">
          *{sale.invoiceNumber}*
        </div>
        <p className="text-[10px] text-gray-600 leading-tight">
          Cuts once made from rolls cannot be exchanged or refunded.
        </p>
        <p className="text-[11px] font-bold text-black">
          THANK YOU FOR SHOPPING WITH US!
        </p>
      </div>
    </div>
  );
}
