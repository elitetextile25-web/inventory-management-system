"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Receipt, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TaxSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    taxEnabled: false,
    taxName: "VAT",
    taxRate: "0",
    taxNumber: "",
    taxInclusive: false,
  });

  React.useEffect(() => {
    fetch("/api/settings/tax")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            taxEnabled: !!data.taxEnabled,
            taxName: data.taxName || "VAT",
            taxRate: String(data.taxRate || 0),
            taxNumber: data.taxNumber || "",
            taxInclusive: !!data.taxInclusive,
          });
        }
      })
      .catch(() => toast.error("Failed to load tax settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings/tax", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Failed to save tax settings");
        return;
      }
      toast.success("Tax settings saved!");
    } catch {
      toast.error("Failed to save tax settings");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

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
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Tax Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              VAT/tax rates and configuration
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
          <CardTitle className="text-base">Tax Configuration</CardTitle>
          <CardDescription>Set up tax rates applied to sales and purchases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-xs font-semibold text-foreground">Enable Tax</p>
              <p className="text-[11px] text-muted-foreground">
                Apply tax to all sales invoices
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.taxEnabled}
              onChange={(e) => setForm((p) => ({ ...p, taxEnabled: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Tax Name
              </label>
              <input
                type="text"
                value={form.taxName}
                onChange={(e) => setForm((p) => ({ ...p, taxName: e.target.value }))}
                placeholder="e.g. VAT, GST, Sales Tax"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={(e) => setForm((p) => ({ ...p, taxRate: e.target.value }))}
                placeholder="e.g. 15"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Tax Registration / BIN Number
            </label>
            <input
              type="text"
              value={form.taxNumber}
              onChange={(e) => setForm((p) => ({ ...p, taxNumber: e.target.value }))}
              placeholder="Your tax ID or BIN"
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-xs font-semibold text-foreground">Tax Inclusive Pricing</p>
              <p className="text-[11px] text-muted-foreground">
                Product prices already include tax (tax is calculated backwards)
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.taxInclusive}
              onChange={(e) => setForm((p) => ({ ...p, taxInclusive: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
