"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Store as StoreIcon, Save, Globe, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "BDT", label: "৳ Bangladeshi Taka (BDT)" },
  { code: "USD", label: "$ US Dollar (USD)" },
  { code: "EUR", label: "€ Euro (EUR)" },
  { code: "GBP", label: "£ British Pound (GBP)" },
  { code: "INR", label: "₹ Indian Rupee (INR)" },
  { code: "SAR", label: "﷼ Saudi Riyal (SAR)" },
  { code: "AED", label: "د.إ UAE Dirham (AED)" },
  { code: "MYR", label: "RM Malaysian Ringgit (MYR)" },
];

const TIMEZONES = [
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kuala_Lumpur",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export default function StoreSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    currency: "BDT",
    timezone: "Asia/Dhaka",
    locale: "en-BD",
    storeName: "",
    storeAddress: "",
    storePhone: "",
    storeEmail: "",
  });

  React.useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            currency: data.org?.currency || "BDT",
            timezone: data.org?.timezone || "Asia/Dhaka",
            locale: data.org?.locale || "en-BD",
            storeName: data.store?.name || "",
            storeAddress: data.store?.address || "",
            storePhone: data.store?.phone || "",
            storeEmail: data.store?.email || "",
          });
        }
      })
      .catch(() => toast.error("Failed to load store settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Failed to save");
        return;
      }
      toast.success("Store settings saved!");
    } catch {
      toast.error("Failed to save store settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <StoreIcon className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Store</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Store settings, timezone, and currency
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
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Regional Settings
          </CardTitle>
          <CardDescription>Currency, timezone, and locale for your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className={selectClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className={selectClass}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-muted-foreground" />
            Store Details
          </CardTitle>
          <CardDescription>Physical store or branch information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Store Name
            </label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => handleChange("storeName", e.target.value)}
              placeholder="Main Branch"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Store Address
            </label>
            <input
              type="text"
              value={form.storeAddress}
              onChange={(e) => handleChange("storeAddress", e.target.value)}
              placeholder="Store street address"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Store Phone
              </label>
              <input
                type="tel"
                value={form.storePhone}
                onChange={(e) => handleChange("storePhone", e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Store Email
              </label>
              <input
                type="email"
                value={form.storeEmail}
                onChange={(e) => handleChange("storeEmail", e.target.value)}
                placeholder="store@business.com"
                className={inputClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
