"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Hash, Save, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Sequence {
  id: string;
  type: string;
  prefix: string;
  lastNumber: number;
  padding: number;
}

const DOC_TYPES = [
  { value: "SALE", label: "Sales Invoice" },
  { value: "PURCHASE", label: "Purchase Order" },
  { value: "RETURN", label: "Return / Credit Note" },
  { value: "EXPENSE", label: "Expense Voucher" },
  { value: "PAYMENT", label: "Payment Receipt" },
];

export default function SequencesSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [sequences, setSequences] = React.useState<Sequence[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newSeq, setNewSeq] = React.useState({ type: "SALE", prefix: "INV", padding: "6" });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/sequences");
      const data = await res.json();
      setSequences(data.sequences || []);
    } catch {
      toast.error("Failed to load document sequences");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpsert = async (type: string, prefix: string, padding: number) => {
    try {
      setSaving(type);
      const res = await fetch("/api/settings/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPSERT", type, prefix, padding }),
      });
      if (!res.ok) {
        toast.error("Failed to save sequence");
        return;
      }
      toast.success(`${type} sequence saved!`);
      fetchData();
    } catch {
      toast.error("Failed to save sequence");
    } finally {
      setSaving(null);
    }
  };

  const handleCreateNew = async () => {
    if (!newSeq.prefix.trim()) {
      toast.error("Prefix is required");
      return;
    }
    await handleUpsert(newSeq.type, newSeq.prefix, parseInt(newSeq.padding) || 6);
    setShowAdd(false);
    setNewSeq({ type: "SALE", prefix: "INV", padding: "6" });
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
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Hash className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Document Sequences</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Invoice, PO number prefixes and auto-numbering
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Sequence
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Sequence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Document Type
                </label>
                <select
                  value={newSeq.type}
                  onChange={(e) => setNewSeq((p) => ({ ...p, type: e.target.value }))}
                  className={selectClass}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Prefix *
                </label>
                <input
                  type="text"
                  value={newSeq.prefix}
                  onChange={(e) => setNewSeq((p) => ({ ...p, prefix: e.target.value.toUpperCase() }))}
                  placeholder="e.g. INV, PO, RET"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Padding (digits)
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={newSeq.padding}
                  onChange={(e) => setNewSeq((p) => ({ ...p, padding: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Preview: <span className="font-mono font-semibold text-foreground">{newSeq.prefix}-{"0".repeat(Math.max(0, (parseInt(newSeq.padding) || 6) - 1))}1</span>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateNew} disabled={saving !== null}>
                {saving ? "Saving..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured Sequences ({sequences.length})</CardTitle>
          <CardDescription>Auto-incrementing number patterns for each document type</CardDescription>
        </CardHeader>
        <CardContent>
          {sequences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sequences configured. Click &quot;Add Sequence&quot; to set up auto-numbering.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {sequences.map((seq) => {
                const nextNum = seq.lastNumber + 1;
                const preview = `${seq.prefix}-${String(nextNum).padStart(seq.padding, "0")}`;
                return (
                  <div key={seq.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{seq.type}</p>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {seq.prefix}-{"X".repeat(seq.padding)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Next: <span className="font-mono font-semibold text-foreground">{preview}</span>
                        {" · "}Last issued: #{seq.lastNumber}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
