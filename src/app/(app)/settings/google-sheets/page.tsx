"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Download,
  ExternalLink, Copy, Check, Sparkles, Cloud, Database,
  ShieldCheck, HelpCircle, Layers
} from "lucide-react";
import { Scissors, FileSpreadsheet } from "@/components/ui/fabric-icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GOOGLE_APPS_SCRIPT_CODE } from "@/lib/google-sheets";
import { toast } from "sonner";

export default function GoogleSheetsSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [autoSync, setAutoSync] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);
  const [counts, setCounts] = React.useState({
    fabrics: 0,
    sales: 0,
    customers: 0,
    suppliers: 0,
  });

  const isConnected = Boolean(webhookUrl && webhookUrl.startsWith("http"));

  // Fetch current integration status
  const fetchStatus = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/google-sheets");
      const data = await res.json();
      if (res.ok) {
        setWebhookUrl(data.webhookUrl || "");
        setAutoSync(Boolean(data.autoSync));
        setLastSyncedAt(data.lastSyncedAt || null);
        if (data.counts) setCounts(data.counts);
      }
    } catch {
      toast.error("Failed to load Google Sheets integration status");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSaveConfig = async () => {
    if (webhookUrl && !webhookUrl.startsWith("http")) {
      toast.error("Please enter a valid URL starting with https://");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SAVE_CONFIG", webhookUrl, autoSync }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save settings");
        return;
      }
      toast.success("Google Sheets configuration saved!");
    } catch {
      toast.error("An error occurred while saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    if (!webhookUrl) {
      toast.error("Please paste your Google Apps Script Web App URL first");
      return;
    }

    try {
      setSyncing(true);
      const res = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_NOW", webhookUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Sync failed. Check your Web App URL and permissions.");
        return;
      }
      toast.success(data.message || "Synced all fabric records to Google Sheets!");
      setLastSyncedAt(data.syncedAt || new Date().toLocaleTimeString());
    } catch {
      toast.error("Network error during sync to Google Sheets");
    } finally {
      setSyncing(false);
    }
  };

  const handleImportFabrics = async () => {
    if (!webhookUrl) {
      toast.error("Please paste your Google Apps Script Web App URL first");
      return;
    }

    try {
      setImporting(true);
      const res = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "IMPORT_FABRICS", webhookUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to import from Google Sheets");
        return;
      }
      toast.success(data.message || "Fabrics imported successfully!");
      fetchStatus();
    } catch {
      toast.error("Network error during import from Google Sheets");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadXlsx = async () => {
    try {
      setDownloading(true);
      const res = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXPORT_XLSX" }),
      });

      if (!res.ok) {
        toast.error("Failed to generate Google Sheets workbook file");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "FabricPro_GoogleSheets_Storage.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Workbook downloaded! You can upload this directly to Google Drive.");
    } catch {
      toast.error("Failed to download workbook");
    } finally {
      setDownloading(false);
    }
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    toast.success("Google Apps Script code copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings" title="Back to settings">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Google Sheets Storage & Sync
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Store and live-sync your fabric shop data directly to your free 15 GB Google Drive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadXlsx}
            disabled={downloading}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Preparing..." : "Download .xlsx Workbook"}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                isConnected
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {isConnected ? "Google Sheet Connected & Live" : "Not Connected Yet"}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isConnected
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isConnected ? "Active Sync" : "Setup Required"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConnected
                  ? `Last synchronized: ${lastSyncedAt || "Never"}`
                  : "Connect your Google Sheet to start storing fabric rolls, stock, and POS sales."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              size="sm"
              onClick={handleSyncNow}
              disabled={syncing || !webhookUrl}
              className="flex-1 md:flex-initial gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync All to Google Sheet"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImportFabrics}
              disabled={importing || !webhookUrl}
              className="gap-1.5"
              title="Read fabric rows from Google Sheet"
            >
              <Cloud className="w-4 h-4" />
              {importing ? "Importing..." : "Pull from Sheet"}
            </Button>
          </div>
        </div>

        {/* Counts summary banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-t border-border bg-card">
          <div className="p-3.5 text-center">
            <p className="text-xl font-bold text-foreground">{counts.fabrics}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Fabrics in Catalog</p>
          </div>
          <div className="p-3.5 text-center">
            <p className="text-xl font-bold text-foreground">{counts.sales}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Sales & Invoices</p>
          </div>
          <div className="p-3.5 text-center">
            <p className="text-xl font-bold text-foreground">{counts.customers}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Boutiques & Tailors</p>
          </div>
          <div className="p-3.5 text-center">
            <p className="text-xl font-bold text-foreground">{counts.suppliers}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Textile Mills</p>
          </div>
        </div>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Google Sheet Webhook Connection</CardTitle>
          <CardDescription>
            Enter the Google Apps Script Web App URL from your Google Sheet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
              <Button
                onClick={handleSaveConfig}
                disabled={saving}
                className="shrink-0"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Follow the 3-step setup guide below to get your free URL in 2 minutes.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Automatic Background Sync
              </p>
              <p className="text-[11px] text-muted-foreground">
                Automatically push new fabric sales and products to Google Sheets in real-time
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3-Step Setup Instructions */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">
              How to Connect Your Free 15 GB Google Sheet (in 3 Minutes)
            </CardTitle>
          </div>
          <CardDescription>
            No credit card or Google Cloud Console required. Runs completely free on your personal Google Drive account!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-semibold text-foreground text-sm">
                Create a Blank Sheet
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Open your Google Drive or visit{" "}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  sheets.new <ExternalLink className="w-3 h-3" />
                </a>{" "}
                to create a new spreadsheet named &quot;FabricPro Storage&quot;.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-semibold text-foreground text-sm">
                Paste the Sync Script
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                In the Google Sheet menu, click <strong>Extensions &gt; Apps Script</strong>.
                Delete existing text, paste the script code below, and save.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-semibold text-foreground text-sm">
                Deploy as Web App
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Click <strong>Deploy &gt; New deployment</strong>, choose type <strong>Web app</strong>,
                set access to <strong>Anyone</strong>, click Deploy, and paste the URL above!
              </p>
            </div>
          </div>

          {/* Script Copy Box */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Google Apps Script Code (Copy &amp; Paste into Sheet)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyScriptCode}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Script Code"}
              </Button>
            </div>

            <div className="relative rounded-xl border border-border bg-muted/40 p-3 overflow-x-auto max-h-56 scrollbar-thin">
              <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet Tabs Structure Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What Gets Stored in Your Google Sheet</CardTitle>
          <CardDescription>
            The sync script automatically organizes your data across 5 distinct tabs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <p className="font-bold text-foreground">🧵 1. Fabrics Catalog</p>
              <p className="text-muted-foreground text-[11px] mt-1">
                SKU, Fabric Name, Category, Mill/Brand, Unit (m/yd/roll), Purchase Cost, Selling Price, Margin %, Min Stock Alert.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <p className="font-bold text-foreground">📦 2. Stock Balances</p>
              <p className="text-muted-foreground text-[11px] mt-1">
                SKU, Fabric Name, Branch/Store, Total Meters Available, Average Cost per Meter, Total Inventory Valuation.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <p className="font-bold text-foreground">🧾 3. Sales &amp; Invoices</p>
              <p className="text-muted-foreground text-[11px] mt-1">
                Invoice Number, Sale Date, Customer/Boutique Name, POS Channel, Subtotal, Discounts, Grand Total, Paid, Payment Status.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/20">
              <p className="font-bold text-foreground">👥 4. Boutiques &amp; Tailors</p>
              <p className="text-muted-foreground text-[11px] mt-1">
                Boutique Name, Contact Phone, Email, Market/Shop Address, Credit Limit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
