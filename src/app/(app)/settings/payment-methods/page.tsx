"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: string;
  openingBalance: string;
  currentBalance: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function PaymentMethodsPage() {
  const [loading, setLoading] = React.useState(true);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [newAccount, setNewAccount] = React.useState({
    name: "",
    type: "CASH",
    openingBalance: "0",
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/payment-methods");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!newAccount.name.trim()) {
      toast.error("Account name is required");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/settings/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE", ...newAccount }),
      });
      if (!res.ok) {
        toast.error("Failed to create payment method");
        return;
      }
      toast.success("Payment method created!");
      setNewAccount({ name: "", type: "CASH", openingBalance: "0" });
      setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Failed to create payment method");
    } finally {
      setSaving(false);
    }
  };

  const TYPES = [
    { value: "CASH", label: "Cash" },
    { value: "BANK", label: "Bank Account" },
    { value: "MOBILE_BANKING", label: "Mobile Banking (bKash/Nagad)" },
    { value: "CARD", label: "Card Terminal" },
    { value: "CHEQUE", label: "Cheque" },
  ];

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
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Payment Methods</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure cash, bank, and mobile banking accounts
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Method
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Main Cash Register"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Type
                </label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount((p) => ({ ...p, type: e.target.value }))}
                  className={selectClass}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Opening Balance
                </label>
                <input
                  type="number"
                  value={newAccount.openingBalance}
                  onChange={(e) => setNewAccount((p) => ({ ...p, openingBalance: e.target.value }))}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Accounts ({accounts.length})</CardTitle>
          <CardDescription>All configured payment methods for POS and invoicing</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No payment methods configured. Click &quot;Add Method&quot; to create one.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{acc.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{acc.type}</Badge>
                      {acc.isDefault && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Default</Badge>
                      )}
                      {!acc.isActive && (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Balance: ৳{parseFloat(acc.currentBalance || "0").toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
