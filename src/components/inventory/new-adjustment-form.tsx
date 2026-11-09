"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Store as StoreIcon,
  Warehouse,
  Plus,
  Trash2,
  Calendar,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface StoreOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface StorageLocationOption {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  purchaseCost: number | string;
  unit?: { abbreviation: string } | null;
  inventoryBalances?: { storeId: string; quantity: number | string }[];
}

interface NewAdjustmentFormProps {
  stores: StoreOption[];
  storageLocations?: StorageLocationOption[];
  products: ProductOption[];
  defaultStoreId?: string;
}

interface AdjustmentItemRow {
  id: string;
  productId: string;
  systemQuantity: number;
  adjustedQuantity: number;
  notes?: string;
}

const REASONS = [
  "Physical Recount / Variance",
  "Damaged Goods",
  "Theft or Unaccounted Loss",
  "Expired Stock",
  "Quality Defect / Scrap",
  "Initial Stock Correction",
  "Internal Transfer Discrepancy",
  "Sample / Marketing Usage",
  "Other",
];

export function NewAdjustmentForm({
  stores,
  storageLocations = [],
  products,
  defaultStoreId,
}: NewAdjustmentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  // Selected store
  const [storeId, setStoreId] = React.useState<string>(
    defaultStoreId || stores[0]?.id || ""
  );

  // Optional storage location
  const [storageLocationId, setStorageLocationId] = React.useState<string>("");

  // Adjustment header details
  const [reason, setReason] = React.useState<string>(REASONS[0]);
  const [customReason, setCustomReason] = React.useState<string>("");
  const [adjustmentDate, setAdjustmentDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = React.useState<string>("");

  // Helper to get system quantity for a product in selected store
  const getSystemStock = React.useCallback(
    (prodId: string, currentStoreId: string) => {
      const prod = products.find((p) => p.id === prodId);
      if (!prod || !prod.inventoryBalances) return 0;
      const bal = prod.inventoryBalances.find((b) => b.storeId === currentStoreId);
      return bal ? Number(bal.quantity) : 0;
    },
    [products]
  );

  // Initialize with one item row if products exist
  const [items, setItems] = React.useState<AdjustmentItemRow[]>(() => {
    if (products.length > 0) {
      const initialStock = products[0]
        ? Number(products[0].inventoryBalances?.[0]?.quantity || 0)
        : 0;
      return [
        {
          id: "item-1",
          productId: products[0]?.id || "",
          systemQuantity: initialStock,
          adjustedQuantity: initialStock,
          notes: "",
        },
      ];
    }
    return [];
  });

  // When store changes, update system quantity for all selected products
  const handleStoreChange = (newStoreId: string) => {
    setStoreId(newStoreId);
    setItems((prev) =>
      prev.map((item) => {
        const sys = getSystemStock(item.productId, newStoreId);
        return {
          ...item,
          systemQuantity: sys,
          // keep existing adjustedQuantity or sync
        };
      })
    );
  };

  const handleProductChange = (rowId: string, newProductId: string) => {
    const sys = getSystemStock(newProductId, storeId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              productId: newProductId,
              systemQuantity: sys,
              adjustedQuantity: sys,
            }
          : item
      )
    );
  };

  const handleAdjustedQtyChange = (rowId: string, value: string) => {
    const parsed = value === "" ? 0 : parseFloat(value);
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              adjustedQuantity: isNaN(parsed) ? 0 : Math.max(0, parsed),
            }
          : item
      )
    );
  };

  const handleItemNoteChange = (rowId: string, noteVal: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId ? { ...item, notes: noteVal } : item
      )
    );
  };

  const addItemRow = () => {
    // Find first product not yet in items, or default to first
    const usedIds = new Set(items.map((i) => i.productId));
    const nextProd = products.find((p) => !usedIds.has(p.id)) || products[0];

    const sys = nextProd ? getSystemStock(nextProd.id, storeId) : 0;
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: nextProd?.id || "",
        systemQuantity: sys,
        adjustedQuantity: sys,
        notes: "",
      },
    ]);
  };

  const removeItemRow = (rowId: string) => {
    if (items.length <= 1) {
      toast.error("Adjustment must contain at least one item");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== rowId));
  };

  // Live Summary Calculations
  const summary = React.useMemo(() => {
    let positiveVariance = 0;
    let negativeVariance = 0;
    let netVariance = 0;
    let totalCostImpact = 0;

    items.forEach((item) => {
      const diff = item.adjustedQuantity - item.systemQuantity;
      netVariance += diff;
      if (diff > 0) positiveVariance += diff;
      if (diff < 0) negativeVariance += Math.abs(diff);

      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? Number(prod.purchaseCost) : 0;
      totalCostImpact += diff * cost;
    });

    return {
      totalItems: items.length,
      positiveVariance,
      negativeVariance,
      netVariance,
      totalCostImpact,
    };
  }, [items, products]);

  const handleSubmit = async (targetStatus: "APPROVED" | "DRAFT") => {
    if (!storeId) {
      toast.error("Please select a store");
      return;
    }

    const finalReason = reason === "Other" && customReason.trim() ? customReason.trim() : reason;
    if (!finalReason) {
      toast.error("Please specify an adjustment reason");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one product item");
      return;
    }

    // Check for duplicate products
    const productIds = items.map((i) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      toast.error("Duplicate product detected. Please combine multiple entries for the same product into one row.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storeId,
        storageLocationId: storageLocationId || undefined,
        reason: finalReason,
        notes: notes.trim() || undefined,
        status: targetStatus,
        items: items.map((i) => ({
          productId: i.productId,
          systemQuantity: i.systemQuantity,
          adjustedQuantity: i.adjustedQuantity,
          difference: i.adjustedQuantity - i.systemQuantity,
          notes: i.notes?.trim() || undefined,
        })),
      };

      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create stock adjustment");
      }

      toast.success(data.message || "Stock adjustment successfully recorded!");
      router.push("/inventory/adjustments");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory/adjustments">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              New Stock Adjustment
            </h1>
            <p className="text-xs text-muted-foreground">
              Reconcile physical fabric stock counts, record damages, scrap, or inventory variance
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit("DRAFT")}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit("APPROVED")}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Apply Adjustment
          </Button>
        </div>
      </div>

      {/* Basic Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-primary" /> Adjustment Details &amp; Store Location
          </CardTitle>
          <CardDescription>
            Select the branch store and optional warehouse storage location where the physical stock change applies.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Store Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              Store / Branch <span className="text-danger">*</span>
            </label>
            <select
              value={storeId}
              onChange={(e) => handleStoreChange(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Storage Location (Optional Module Integration) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              Storage Location <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <select
              value={storageLocationId}
              onChange={(e) => setStorageLocationId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select Warehouse / Storage (Optional) —</option>
              {storageLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code} · {loc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              Adjustment Reason <span className="text-danger">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              Adjustment Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={adjustmentDate}
              onChange={(e) => setAdjustmentDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Custom Reason input if "Other" is selected */}
          {reason === "Other" && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-foreground">Specify Reason</label>
              <input
                type="text"
                placeholder="Enter custom adjustment reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Notes */}
          <div className={`space-y-1.5 ${reason === "Other" ? "md:col-span-2" : "md:col-span-4"}`}>
            <label className="text-xs font-medium text-foreground">Adjustment Remarks &amp; Notes</label>
            <input
              type="text"
              placeholder="e.g., Audit roll recount conducted after quarterly inventory review..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Fabric Products &amp; Physical Counts
            </CardTitle>
            <CardDescription>
              Specify the actual counted physical inventory. Variances will be automatically calculated.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addItemRow} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase text-left">
                  <th className="px-4 py-3 min-w-[220px]">Fabric / Product</th>
                  <th className="px-4 py-3 text-right w-[130px]">System Stock</th>
                  <th className="px-4 py-3 text-right w-[150px]">Physical Count</th>
                  <th className="px-4 py-3 text-right w-[140px]">Variance</th>
                  <th className="px-4 py-3 min-w-[180px]">Item Note</th>
                  <th className="px-4 py-3 text-center w-[60px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => {
                  const prod = products.find((p) => p.id === item.productId);
                  const diff = item.adjustedQuantity - item.systemQuantity;
                  const unitAbbr = prod?.unit?.abbreviation || "units";

                  return (
                    <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                      {/* Product selector */}
                      <td className="px-4 py-3">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(item.id, e.target.value)}
                          className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* System Stock */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs font-semibold text-foreground px-2 py-1 rounded bg-muted">
                          {formatNumber(item.systemQuantity, 2)} {unitAbbr}
                        </span>
                      </td>

                      {/* Adjusted physical count input */}
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.adjustedQuantity}
                          onChange={(e) => handleAdjustedQtyChange(item.id, e.target.value)}
                          className="w-full h-9 text-right rounded-lg border border-input bg-background px-2.5 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </td>

                      {/* Variance badge */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                            diff > 0
                              ? "bg-success/15 text-success"
                              : diff < 0
                              ? "bg-danger/15 text-danger"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {diff > 0 ? (
                            <>
                              <TrendingUp className="w-3 h-3" /> +{formatNumber(diff, 2)}
                            </>
                          ) : diff < 0 ? (
                            <>
                              <TrendingDown className="w-3 h-3" /> {formatNumber(diff, 2)}
                            </>
                          ) : (
                            "0.00"
                          )}{" "}
                          {unitAbbr}
                        </span>
                      </td>

                      {/* Line Item Note */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="e.g. Roll torn during transit"
                          value={item.notes || ""}
                          onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                          className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Items Count</p>
            <p className="text-xl font-bold mt-1">{summary.totalItems} fabrics</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-success uppercase font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Surplus Variance
            </p>
            <p className="text-xl font-bold text-success mt-1">
              +{formatNumber(summary.positiveVariance, 2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-danger uppercase font-semibold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Shrinkage / Defect
            </p>
            <p className="text-xl font-bold text-danger mt-1">
              -{formatNumber(summary.negativeVariance, 2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-primary uppercase font-semibold">Net Cost Impact</p>
            <p className={`text-xl font-bold mt-1 ${summary.totalCostImpact >= 0 ? "text-success" : "text-danger"}`}>
              {summary.totalCostImpact >= 0 ? "+" : ""}{formatCurrency(summary.totalCostImpact)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          disabled={submitting}
          asChild
        >
          <Link href="/inventory/adjustments">
            Cancel
          </Link>
        </Button>
        <Button
          variant="secondary"
          disabled={submitting}
          onClick={() => handleSubmit("DRAFT")}
          className="gap-1.5"
        >
          <Save className="w-4 h-4" /> Save as Draft
        </Button>
        <Button
          disabled={submitting}
          onClick={() => handleSubmit("APPROVED")}
          className="gap-1.5 shadow-md"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Apply Adjustment &amp; Reconcile Stock
        </Button>
      </div>
    </div>
  );
}

