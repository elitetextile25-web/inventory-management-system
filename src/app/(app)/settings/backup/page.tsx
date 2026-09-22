"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, HardDrive, Save, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BackupSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    autoBackup: false,
    frequency: "daily",
    retentionDays: "30",
    lastBackup: null as string | null,
  });

  React.useEffect(() => {
    fetch("/api/settings/backup")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            autoBackup: !!data.autoBackup,
            frequency: data.frequency || "daily",
            retentionDays: String(data.retentionDays || 30),
            lastBackup: data.lastBackup || null,
          });
        }
      })
      .catch(() => toast.error("Failed to load backup settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings/backup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Failed to save backup settings");
        return;
      }
      toast.success("Backup settings saved!");
    } catch {
      toast.error("Failed to save backup settings");
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer";
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
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Backup & Recovery</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automated backups and restore options
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Status */}
      <Card className="border-border overflow-hidden">
        <div className="p-5 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Backup Status</h3>
              <p className="text-xs text-muted-foreground">
                {form.lastBackup
                  ? `Last backup: ${form.lastBackup}`
                  : "No backups recorded yet"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup Configuration</CardTitle>
          <CardDescription>Set up automatic backups for your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-xs font-semibold text-foreground">Automatic Backups</p>
              <p className="text-[11px] text-muted-foreground">
                Automatically backup your data at regular intervals
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.autoBackup}
              onChange={(e) => setForm((p) => ({ ...p, autoBackup: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Backup Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
                className={selectClass}
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Retention Period (days)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={form.retentionDays}
                onChange={(e) => setForm((p) => ({ ...p, retentionDays: e.target.value }))}
                className={inputClass}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Backups older than this will be automatically deleted
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Data Protection Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="font-semibold text-foreground mb-1">Supabase Cloud Database</p>
              <p>All your data is securely stored in your managed Supabase PostgreSQL cloud database with automated replication.</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="font-semibold text-foreground mb-1">Export Catalog</p>
              <p>Download Excel spreadsheets from Fabrics &amp; Products catalog anytime for offline reporting and archiving.</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="font-semibold text-foreground mb-1">Database Point-in-Time Recovery</p>
              <p>Your Supabase project includes automatic daily snapshots and WAL backups for enterprise disaster recovery.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
