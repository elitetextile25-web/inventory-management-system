"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRightLeft,
  Warehouse,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface LocationOption {
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
}

interface NewTransferFormProps {
  locations: LocationOption[];
  products: ProductOption[];
  defaultSourceId?: string;
}

interface TransferItemRow {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

export function NewTransferForm({
  locations,
  products,
  defaultSourceId,
}: NewTransferFormProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  const [sourceId, setSourceId] = React.useState(
    defaultSourceId || locations[0]?.id || ""
  );
  const [destId, setDestId] = React.useState(
    locations.find((l) => l.id !== (defaultSourceId || locations[0]?.id))?.id || ""
  );
  const [transferDate, setTransferDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = React.useState("");

  const [items, setItems] = React.useState<TransferItemRow[]>([
    {
      id: "item-1",
      productId: products[0]?.id || "",
      quantity: 10,
      unitCost: Number(products[0]?.purchaseCost || 0),
      notes: "",
    },
  ]);

  const availableDestinations = React.useMemo(() => {
    return locations.filter((loc) => loc.id !== sourceId);
  }, [locations, sourceId]);

  React.useEffect(() => {
    if (destId === sourceId) {
      const nextDest = availableDestinations[0]?.id || "";
      setDestId(nextDest);
    }
  }, [sourceId, destId, availableDestinations]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        productId: products[0]?.id || "",
        quantity: 10,
        unitCost: Number(products[0]?.purchaseCost || 0),
        notes: "",
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) {
      toast.error("At least one product item is required");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof TransferItemRow, value: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (field === "productId") {
          const prod = products.find((p) => p.id === value);
          return {
            ...i,
            productId: value,
            unitCost: Number(prod?.purchaseCost || 0),
          };
        }
        return { ...i, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceId) {
      toast.error("Please select a source storage location");
      return;
    }
    if (!destId) {
      toast.error("Please select a destination storage location");
      return;
    }
    if (sourceId === destId) {
      toast.error("Source and destination storage locations cannot be identical");
      return;
    }
    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      toast.error("Each row must have a valid product and quantity greater than 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sourceLocationId: sourceId,
        destinationLocationId: destId,
        transferDate,
        status: "COMPLETED",
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          notes: i.notes || null,
        })),
      };

      const res = await fetch("/api/store-management/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to execute stock transfer");
      }

      toast.success(
        `Stock Transfer #${json.data.transferNumber} executed successfully!`,
        { icon: "📦" }
      );

      router.push("/store-management/transfers");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/store-management/transfers"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-primary" /> Stock Transfer
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Move inventory between storage locations, central warehouses, and showrooms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store-management/transfers">
            <Button variant="outline" type="button" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2 shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm & Transfer Stock
          </Button>
        </div>
      </div>

      {/* Origin & Destination Locations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-primary" /> Transfer Route & Date
          </CardTitle>
          <CardDescription className="text-xs">
            Select source storage location (stock out) and destination location (stock in)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Source Storage Location (From) <span className="text-destructive">*</span>
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code} - {loc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Destination Storage Location (To) <span className="text-destructive">*</span>
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                {availableDestinations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code} - {loc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Transfer Date
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Transfer Notes & Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Replenishment for flagship showroom cutting counter, delivery vehicle #3..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Products & Quantities to Transfer
            </CardTitle>
            <Button size="sm" variant="outline" type="button" onClick={addItemRow} className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Add Product Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                  <th className="px-4 py-3 min-w-[240px]">Product / Fabric</th>
                  <th className="px-4 py-3 w-[140px]">Quantity</th>
                  <th className="px-4 py-3 w-[140px]">Unit Cost (৳)</th>
                  <th className="px-4 py-3 min-w-[180px]">Item Notes</th>
                  <th className="px-4 py-3 text-right w-[60px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-ring text-right pr-8"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground font-sans">
                            {prod?.unit?.abbreviation || ""}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring text-right"
                        />
                      </td>

                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          placeholder="Roll # / Batch # / Remarks"
                          value={item.notes || ""}
                          onChange={(e) => updateItem(item.id, "notes", e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>

                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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

      {/* Submit footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/store-management/transfers">
          <Button variant="outline" type="button" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving} className="gap-2 shadow-sm min-w-[180px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Confirm & Transfer Stock
        </Button>
      </div>
    </form>
  );
}

