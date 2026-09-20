"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ScrollText, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
}

export default function AuditSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [retentionDays, setRetentionDays] = React.useState("365");
  const limit = 20;

  const fetchData = React.useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/settings/audit?page=${p}&limit=${limit}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setRetentionDays(String(data.retentionDays || 365));
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const handleSaveRetention = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings/audit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionDays: parseInt(retentionDays) }),
      });
      if (!res.ok) {
        toast.error("Failed to save");
        return;
      }
      toast.success("Audit settings saved!");
    } catch {
      toast.error("Failed to save audit settings");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const actionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("INSERT")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (action.includes("DELETE") || action.includes("REMOVE")) return "bg-red-500/10 text-red-600 dark:text-red-400";
    return "bg-muted text-muted-foreground";
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings" title="Back to settings">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ScrollText className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Audit Log Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Log retention and access control
            </p>
          </div>
        </div>
      </div>

      {/* Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log Retention</CardTitle>
          <CardDescription>Configure how long audit logs are kept</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Retention Period (days)
              </label>
              <input
                type="number"
                min="30"
                max="3650"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className={inputClass}
              />
            </div>
            <Button onClick={handleSaveRetention} disabled={saving} className="gap-2 shrink-0">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Recent Activity ({total.toLocaleString()} total)
              </CardTitle>
              <CardDescription>All tracked changes in your organization</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No audit log entries found
            </p>
          ) : (
            <>
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${actionColor(log.action)}`}
                        >
                          {log.action}
                        </Badge>
                        <span className="text-xs font-medium text-foreground">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[120px]">
                            {log.entityId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {log.actor ? `${log.actor.name} (${log.actor.email})` : "System"}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
