"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Building2,
  Calendar,
  Layers,
  Banknote,
  CreditCard,
  Building,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  purchaseCost: number | string;
  unit?: { name: string; abbreviation: string } | null;
  category?: { name: string } | null;
}

interface Supplier {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
}

interface NewPurchaseClientProps {
  products: Product[];
  suppliers: Supplier[];
  defaultOrderNumber: string;
}

interface PurchaseLineItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitCost: number;
  quantity: number;
  discountAmount: number;
  taxAmount: number;
  unit: string;
}

export function NewPurchaseClient({
  products,
  suppliers,
  defaultOrderNumber,
}: NewPurchaseClientProps) {
  const router = useRouter();

  const [orderNumber, setOrderNumber] = React.useState(defaultOrderNumber);
  const [orderDate, setOrderDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = React.useState("");
  const [supplierId, setSupplierId] = React.useState(suppliers[0]?.id || "");
  const [shippingCost, setShippingCost] = React.useState<number>(0);
  const [overallDiscount, setOverallDiscount] = React.useState<number>(0);
  const [paidAmount, setPaidAmount] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "CASH" | "BANK" | "CARD" | "MOBILE_BANKING" | "OTHER"
  >("BANK");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [items, setItems] = React.useState<PurchaseLineItem[]>([
    {
      id: "item-1",
      productId: "",
      productName: "",
      productSku: "",
      unitCost: 0,
      quantity: 50,
      discountAmount: 0,
      taxAmount: 0,
      unit: "m",
    },
  ]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        productId: "",
        productName: "",
        productSku: "",
        unitCost: 0,
        quantity: 50,
        discountAmount: 0,
        taxAmount: 0,
        unit: "m",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error("Purchase order must have at least one item");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseLineItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "productId") {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          item.productId = prod.id;
          item.productName = prod.name;
          item.productSku = prod.sku;
          item.unitCost = Number(prod.purchaseCost);
          item.unit = prod.unit?.abbreviation || "m";
        }
      } else {
        (item as any)[field] = val;
      }

      updated[index] = item;
      return updated;
    });
  };

  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitCost - (Number(item.discountAmount) || 0);
    return sum + Math.max(0, lineTotal);
  }, 0);

  const grandTotal = Math.max(
    0,
    subtotal - (Number(overallDiscount) || 0) + (Number(shippingCost) || 0)
  );
  const actualPaid = paidAmount === "" ? grandTotal : Number(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - actualPaid);

  const handleSaveOrder = async (markReceived = true) => {
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    const invalidItem = items.find((i) => !i.productId || i.quantity <= 0);
    if (invalidItem) {
      toast.error("Please select a valid fabric product and quantity for all lines");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        supplierId,
        orderNumber,
        orderDate,
        expectedDate: expectedDate || null,
        status: markReceived ? "RECEIVED" : "ORDERED",
        subtotal,
        discountAmount: Number(overallDiscount) || 0,
        taxAmount: 0,
        shippingCost: Number(shippingCost) || 0,
        grandTotal,
        paidAmount: actualPaid,
        dueAmount,
        paymentMethod,
        notes: notes || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          discountAmount: Number(i.discountAmount) || 0,
          taxAmount: 0,
          lineTotal: Math.max(0, i.quantity * i.unitCost - (Number(i.discountAmount) || 0)),
          productName: i.productName,
          productSku: i.productSku,
        })),
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create purchase order");
      }

      toast.success(`Purchase Order #${orderNumber} recorded!`, { icon: "📦" });
      router.push(`/purchases/${json.data.id}`);
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
            href="/purchases"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              New Purchase Order
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record mill deliveries, fabric purchases, and supplier bills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => handleSaveOrder(false)}
            className="gap-2"
          >
            <FileText className="w-4 h-4" /> Save as Ordered
          </Button>
          <Button
            disabled={saving}
            onClick={() => handleSaveOrder(true)}
            className="gap-2 shadow-md"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Receive Stock & Confirm
          </Button>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> PO Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                PO Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Order Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Supplier & Mill Info
              </span>
              <Link
                href="/suppliers"
                className="text-xs text-primary font-medium hover:underline"
              >
                + Manage Suppliers
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Select Supplier / Mill
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.company ? `(${s.company})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Fabric & Textile Items Ordered
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addItemRow} className="h-8 gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Fabric Row
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
                  <th className="px-3 py-3 w-28 text-right">Cost Price (৳)</th>
                  <th className="px-3 py-3 w-24 text-right">Disc (৳)</th>
                  <th className="px-4 py-3 w-28 text-right">Total (৳)</th>
                  <th className="px-3 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item, index) => {
                  const lineTotal = Math.max(
                    0,
                    item.quantity * item.unitCost - (Number(item.discountAmount) || 0)
                  );
                  return (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, "productId", e.target.value)}
                          className="w-full h-8 rounded-lg border border-input bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                        >
                          <option value="">-- Choose Fabric or Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) — Cost: ৳{Number(p.purchaseCost)}/{p.unit?.abbreviation || "m"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-16 h-8 rounded-lg border border-input bg-card px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItem(index, "unitCost", parseFloat(e.target.value) || 0)
                          }
                          className="w-24 h-8 rounded-lg border border-input bg-card px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.discountAmount}
                          onChange={(e) =>
                            updateItem(index, "discountAmount", parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="w-20 h-8 rounded-lg border border-input bg-card px-2 text-right text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-foreground">
                        {formatCurrency(lineTotal)}
                      </td>
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

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Supplier Notes & Transport
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              rows={4}
              placeholder="e.g. Transport via Chalan #CH-9982, delivery to main fabric warehouse..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Financial Summary</span>
              <span className="font-mono text-xs text-muted-foreground">BDT (৳)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Shipping / Freight:</span>
              <input
                type="number"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-24 h-7 rounded border border-input bg-background px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Supplier Discount:</span>
              <input
                type="number"
                min="0"
                value={overallDiscount}
                onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-24 h-7 rounded border border-input bg-background px-2 text-right text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex justify-between py-2 border-b border-border font-bold text-sm text-foreground bg-primary/5 px-2 rounded-lg">
              <span className="text-primary font-bold">Grand Total:</span>
              <span className="text-primary text-base font-extrabold">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-medium text-foreground">Paid Amount:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
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

            {dueAmount > 0 && (
              <div className="flex justify-between py-2 px-3 rounded-lg bg-danger/10 text-danger font-semibold">
                <span>Accounts Payable (Due to Supplier):</span>
                <span>{formatCurrency(dueAmount)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
