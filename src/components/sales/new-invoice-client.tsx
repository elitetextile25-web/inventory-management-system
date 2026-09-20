"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ReceiptText,
  User,
  Calendar,
  Layers,
  Banknote,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  FileText,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Scissors } from "@/components/ui/fabric-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number | string;
  purchaseCost: number | string;
  unit?: { name: string; abbreviation: string } | null;
  category?: { name: string } | null;
  inventoryBalances?: { quantity: number | string }[];
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface NewInvoiceClientProps {
  products: Product[];
  customers: Customer[];
  defaultInvoiceNumber: string;
}

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  taxAmount: number;
  unit: string;
  stockAvailable: number;
}

export function NewInvoiceClient({
  products,
  customers,
  defaultInvoiceNumber,
}: NewInvoiceClientProps) {
  const router = useRouter();

  // Invoice header state
  const [invoiceNumber, setInvoiceNumber] = React.useState(defaultInvoiceNumber);
  const [saleDate, setSaleDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [customerId, setCustomerId] = React.useState<string>("");
  const [customerName, setCustomerName] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Line items state
  const [items, setItems] = React.useState<LineItem[]>([
    {
      id: "item-1",
      productId: "",
      productName: "",
      productSku: "",
      unitCost: 0,
      unitPrice: 0,
      quantity: 1,
      discountAmount: 0,
      taxAmount: 0,
      unit: "m",
      stockAvailable: 0,
    },
  ]);

  // Overall discount & payment state
  const [overallDiscount, setOverallDiscount] = React.useState<number>(0);
  const [taxPercent, setTaxPercent] = React.useState<number>(0);
  const [paidAmount, setPaidAmount] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "CASH" | "BANK" | "CARD" | "MOBILE_BANKING" | "OTHER"
  >("CASH");
  const [saving, setSaving] = React.useState(false);

  // Handle customer selection
  const handleCustomerChange = (val: string) => {
    setCustomerId(val);
    const found = customers.find((c) => c.id === val);
    if (found) {
      setCustomerName(found.name);
    } else {
      setCustomerName("");
    }
  };

  // Add line item
  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        productId: "",
        productName: "",
        productSku: "",
        unitCost: 0,
        unitPrice: 0,
        quantity: 1,
        discountAmount: 0,
        taxAmount: 0,
        unit: "m",
        stockAvailable: 0,
      },
    ]);
  };

  // Remove line item
  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error("Invoice must contain at least one line item");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const updateItem = (index: number, field: keyof LineItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "productId") {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          const stock = prod.inventoryBalances?.[0]?.quantity
            ? Number(prod.inventoryBalances[0].quantity)
            : 0;
          item.productId = prod.id;
          item.productName = prod.name;
          item.productSku = prod.sku;
          item.unitPrice = Number(prod.sellingPrice);
          item.unitCost = Number(prod.purchaseCost);
          item.unit = prod.unit?.abbreviation || "m";
          item.stockAvailable = stock;
        }
      } else {
        (item as any)[field] = val;
      }

      updated[index] = item;
      return updated;
    });
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice - (Number(item.discountAmount) || 0);
    return sum + Math.max(0, lineTotal);
  }, 0);

  const taxAmount = (subtotal * (Number(taxPercent) || 0)) / 100;
  const grandTotal = Math.max(0, subtotal - (Number(overallDiscount) || 0) + taxAmount);
  const actualPaid = paidAmount === "" ? grandTotal : Number(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - actualPaid);

  // Status calculation
  const statusPreview = actualPaid >= grandTotal && grandTotal > 0
    ? "PAID"
    : actualPaid > 0
    ? "PARTIALLY_PAID"
    : "CONFIRMED";

  // Submit invoice
  const handleSaveInvoice = async (asDraft = false) => {
    // Validation
    const invalidItem = items.find((i) => !i.productId || i.quantity <= 0);
    if (invalidItem) {
      toast.error("Please select a valid fabric product and quantity for all lines");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customerId: customerId || null,
        invoiceNumber,
        saleDate,
        status: asDraft ? "DRAFT" : statusPreview,
        subtotal,
        discountAmount: Number(overallDiscount) || 0,
        taxAmount,
        grandTotal,
        paidAmount: actualPaid,
        dueAmount,
        paymentMethod,
        notes: notes || null,
        items: items.map((i) => {
          const lineTotal = Math.max(
            0,
            i.quantity * i.unitPrice - (Number(i.discountAmount) || 0)
          );
          return {
            productId: i.productId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            discountAmount: Number(i.discountAmount) || 0,
            taxAmount: 0,
            lineTotal,
            unitCost: Number(i.unitCost) || 0,
            productName: i.productName,
            productSku: i.productSku,
          };
        }),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create invoice");
      }

      toast.success(
        asDraft
          ? `Invoice #${invoiceNumber} saved as draft!`
          : `Invoice #${invoiceNumber} created and confirmed!`,
        { icon: "🧾" }
      );

      router.push(`/sales/${json.data.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                New Invoice
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {statusPreview}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create a retail fabric cut or wholesale billing invoice
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => handleSaveInvoice(true)}
            className="gap-2"
          >
            <FileText className="w-4 h-4" /> Save as Draft
          </Button>
          <Button
            disabled={saving}
            onClick={() => handleSaveInvoice(false)}
            className="gap-2 shadow-md"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Confirm & Save Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Invoice Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-primary" /> Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Invoice Date
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Customer Information
              </span>
              <Link
                href="/customers"
                className="text-xs text-primary font-medium hover:underline"
              >
                + Manage Customers
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Select Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Walk-in Customer (Cash Retail)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Customer Name / Note
              </label>
              <input
                type="text"
                placeholder="Walk-in Retail Buyer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" /> Fabric & Product Items
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addItemRow} className="h-8 gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Fabric Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                  <th className="px-4 py-3 min-w-[220px]">Fabric / Product</th>
                  <th className="px-3 py-3 w-28 text-right">Quantity</th>
                  <th className="px-3 py-3 w-28 text-right">Unit Price (৳)</th>
                  <th className="px-3 py-3 w-24 text-right">Disc (৳)</th>
                  <th className="px-4 py-3 w-28 text-right">Total (৳)</th>
                  <th className="px-3 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item, index) => {
                  const lineTotal = Math.max(
                    0,
                    item.quantity * item.unitPrice - (Number(item.discountAmount) || 0)
                  );
                  return (
                    <tr key={item.id} className="hover:bg-muted/20">
                      {/* Product select */}
                      <td className="px-4 py-2.5">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, "productId", e.target.value)}
                          className="w-full h-8 rounded-lg border border-input bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                        >
                          <option value="">-- Choose Fabric or Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) — ৳{Number(p.sellingPrice)}/{p.unit?.abbreviation || "m"}
                            </option>
                          ))}
                        </select>
                        {item.productId && (
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            <span>SKU: {item.productSku}</span>
                            <span>•</span>
                            <span
                              className={
                                item.stockAvailable <= 10
                                  ? "text-danger font-semibold"
                                  : "text-muted-foreground"
                              }
                            >
                              Stock: {formatNumber(item.stockAvailable, 1)} {item.unit}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            step="0.25"
                            min="0.1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 h-8 rounded-lg border border-input bg-card px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 h-8 rounded-lg border border-input bg-card px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>

                      {/* Line discount */}
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.discountAmount}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "discountAmount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-20 h-8 rounded-lg border border-input bg-card px-2 text-right text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="px-4 py-2.5 text-right font-bold text-foreground">
                        {formatCurrency(lineTotal)}
                      </td>

                      {/* Delete */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => removeItemRow(index)}
                          className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Totals & Payment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes & Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Cutting & Order Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              rows={4}
              placeholder="e.g. Cut 3 pieces of 2.5m each. Delivery to tailoring department..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span>Stock will automatically be deducted from inventory balance upon confirmation.</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Invoice Financial Summary</span>
              <span className="font-mono text-xs text-muted-foreground">BDT (৳)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Items Subtotal:</span>
              <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
            </div>

            {/* Overall Discount */}
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Special Discount:</span>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">-৳</span>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 h-7 rounded border border-input bg-background px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Tax / VAT */}
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Tax / VAT (%):</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 h-7 rounded border border-input bg-background px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground">% = {formatCurrency(taxAmount)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between py-2 border-b border-border font-bold text-sm text-foreground bg-primary/5 px-2 rounded-lg">
              <span className="text-primary font-bold">Grand Total:</span>
              <span className="text-primary text-base font-extrabold">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "CASH", label: "Cash", icon: Banknote },
                  { id: "CARD", label: "Card", icon: CreditCard },
                  { id: "MOBILE_BANKING", label: "bKash", icon: Smartphone },
                  { id: "BANK", label: "Bank", icon: Building },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[11px] font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paid Amount */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-medium text-foreground">Paid Amount:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={String(grandTotal)}
                  className="w-28 h-8 rounded-lg border border-input bg-background px-3 text-right text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[11px] px-2"
                  onClick={() => setPaidAmount(String(grandTotal))}
                >
                  Full
                </Button>
              </div>
            </div>

            {/* Due Amount Alert */}
            {dueAmount > 0 && (
              <div className="flex justify-between py-2 px-3 rounded-lg bg-danger/10 text-danger font-semibold">
                <span>Due Balance (Customer Credit):</span>
                <span>{formatCurrency(dueAmount)}</span>
              </div>
            )}

            {actualPaid > grandTotal && (
              <div className="flex justify-between py-2 px-3 rounded-lg bg-emerald-500/10 text-emerald-600 font-semibold">
                <span>Change to Return:</span>
                <span>{formatCurrency(actualPaid - grandTotal)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
