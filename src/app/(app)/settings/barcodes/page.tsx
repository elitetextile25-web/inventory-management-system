"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ScanBarcode, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BARCODE_TYPES = [
  { value: "EAN13", label: "EAN-13 (International)" },
  { value: "EAN8", label: "EAN-8 (Short)" },
  { value: "CODE128", label: "Code 128 (Versatile)" },
  { value: "CODE39", label: "Code 39 (Alphanumeric)" },
  { value: "UPC", label: "UPC-A (US/Canada)" },
  { value: "QR", label: "QR Code" },
];

export default function BarcodeSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    barcodeType: "EAN13",
    labelWidth: "50",
    labelHeight: "25",
    showPrice: true,
    showName: true,
    showSku: true,
  });

  React.useEffect(() => {
    fetch("/api/settings/barcodes")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            barcodeType: data.barcodeType || "EAN13",
            labelWidth: String(data.labelWidth || 50),
            labelHeight: String(data.labelHeight || 25),
            showPrice: data.showPrice !== false,
            showName: data.showName !== false,
            showSku: data.showSku !== false,
          });
        }
      })
      .catch(() => toast.error("Failed to load barcode settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings/barcodes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Failed to save barcode settings");
        return;
      }
      toast.success("Barcode settings saved!");
    } catch {
      toast.error("Failed to save barcode settings");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
  const selectClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings" title="Back to settings">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ScanBarcode className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Barcode Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Label format, barcode type, and print configuration
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Barcode Format</CardTitle>
          <CardDescription>Choose the barcode symbology used for product labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Barcode Type
            </label>
            <select
              value={form.barcodeType}
              onChange={(e) => setForm((p) => ({ ...p, barcodeType: e.target.value }))}
              className={selectClass}
            >
              {BARCODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Label Width (mm)
              </label>
              <input
                type="number"
                min="20"
                max="200"
                value={form.labelWidth}
                onChange={(e) => setForm((p) => ({ ...p, labelWidth: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Label Height (mm)
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={form.labelHeight}
                onChange={(e) => setForm((p) => ({ ...p, labelHeight: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Label Content</CardTitle>
          <CardDescription>Choose which information to display on printed labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-xs font-semibold text-foreground">Show Product Name</p>
              <p className="text-[11px] text-muted-foreground">Display fabric/product name on the label</p>
            </div>
            <input
              type="checkbox"
              checked={form.showName}
              onChange={(e) => setForm((p) => ({ ...p, showName: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-xs font-semibold text-foreground">Show SKU</p>
              <p className="text-[11px] text-muted-foreground">Display the product SKU code</p>
            </div>
            <input
              type="checkbox"
              checked={form.showSku}
              onChange={(e) => setForm((p) => ({ ...p, showSku: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-xs font-semibold text-foreground">Show Price</p>
              <p className="text-[11px] text-muted-foreground">Display the selling price on the label</p>
            </div>
            <input
              type="checkbox"
              checked={form.showPrice}
              onChange={(e) => setForm((p) => ({ ...p, showPrice: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Label Preview</CardTitle>
          <CardDescription>Approximate preview of your barcode label</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 bg-white dark:bg-zinc-900"
              style={{
                width: `${Math.min(parseInt(form.labelWidth) * 3, 300)}px`,
                minHeight: `${Math.min(parseInt(form.labelHeight) * 3, 200)}px`,
              }}
            >
              {form.showName && (
                <p className="text-[10px] font-semibold text-foreground text-center">
                  Premium Cotton Fabric
                </p>
              )}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-[1px]">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-foreground"
                      style={{
                        width: i % 3 === 0 ? "2px" : "1px",
                        height: "40px",
                      }}
                    />
                  ))}
                </div>
              </div>
              {form.showSku && (
                <p className="text-[9px] font-mono text-muted-foreground">SKU-00001</p>
              )}
              {form.showPrice && (
                <p className="text-[10px] font-bold text-foreground">৳850.00</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
