"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export default function ExpenseCategoriesPage() {
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [newCat, setNewCat] = React.useState({ name: "", description: "" });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/expense-categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      toast.error("Failed to load expense categories");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!newCat.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/settings/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE", ...newCat }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create category");
        return;
      }
      toast.success("Category created!");
      setNewCat({ name: "", description: "" });
      setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/settings/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", id }),
      });
      if (!res.ok) {
        toast.error("Failed to delete. Category may have linked expenses.");
        return;
      }
      toast.success("Category deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete category");
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
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Expense Categories</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage expense category list
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={newCat.name}
                  onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Rent, Utilities, Transport"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={newCat.description}
                  onChange={(e) => setNewCat((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
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
          <CardTitle className="text-base">Categories ({categories.length})</CardTitle>
          <CardDescription>All expense categories used for tracking business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No categories found. Click &quot;Add Category&quot; to create one.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                      {!cat.isActive && (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors p-1"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
