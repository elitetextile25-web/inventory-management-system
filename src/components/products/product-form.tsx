"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Package, DollarSign, Layers, Barcode, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Option {
  id: string;
  name: string;
  abbreviation?: string;
}

interface ProductFormProps {
  initialData?: any;
  categories: Option[];
  brands: Option[];
  units: Option[];
  isEdit?: boolean;
}

export function ProductForm({ initialData, categories, brands, units, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    description: initialData?.description ?? "",
    categoryId: initialData?.categoryId ?? "",
    brandId: initialData?.brandId ?? "",
    unitId: initialData?.unitId ?? "",
    purchaseCost: initialData?.purchaseCost ? Number(initialData.purchaseCost) : 0,
    sellingPrice: initialData?.sellingPrice ? Number(initialData.sellingPrice) : 0,
    minimumStock: initialData?.minimumStock ? Number(initialData.minimumStock) : 10,
    reorderLevel: initialData?.reorderLevel ? Number(initialData.reorderLevel) : 20,
    taxRate: initialData?.taxRate ? Number(initialData.taxRate) : 0,
    barcode: initialData?.barcodes?.[0]?.barcode ?? "",
    initialStock: 0,
    status: initialData?.status ?? "ACTIVE",
  });

  // Calculate live margin
  const cost = Number(form.purchaseCost) || 0;
  const price = Number(form.sellingPrice) || 0;
  const marginPercent = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
  const profitAmount = (price - cost).toFixed(2);

  const generateSku = () => {
    const prefix = form.name
      ? form.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "PRD")
      : "PRD";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setForm((f) => ({ ...f, sku: `${prefix}-${randomNum}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    if (!form.sku.trim()) {
      toast.error("Please enter or generate a SKU");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/products/${initialData.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save product");
        setLoading(false);
        return;
      }

      toast.success(isEdit ? "Product updated successfully!" : "Product created successfully!");
      router.push("/products");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products" title="Back to products">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? `Edit: ${form.name || "Product"}` : "New Product"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit ? "Update details, pricing, and stock settings" : "Add a new item to your inventory catalog"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: General Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Product title, identity, classification, and description</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Radhuni Pure Soybean Oil 5L"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    SKU Code <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="e.g. PRD-1024"
                  className="flex h-10 w-full font-mono rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Brand / Manufacturer</label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Brand —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Unit of Measure</label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Unit —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Product specifications, storage instructions, or warranty notes..."
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pricing & Profitability */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Pricing & Margins</CardTitle>
                <CardDescription>Costs, retail selling prices, and automatic profit calculations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Purchase Cost (৳) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.purchaseCost}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseCost: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Selling Price (৳) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.sellingPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.taxRate}
                  onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Profit margin live badge preview */}
            <div className="p-3.5 rounded-lg bg-muted/60 border border-border flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Estimated Gross Profit:</span>
                <span className="font-semibold text-foreground">৳{profitAmount} / unit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Gross Margin:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${Number(marginPercent) >= 20 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : Number(marginPercent) > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                  {marginPercent}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Inventory & Barcode */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Inventory & Stock Levels</CardTitle>
                <CardDescription>Stock threshold alerts and optional opening quantity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Minimum Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minimumStock}
                  onChange={(e) => setForm((f) => ({ ...f, minimumStock: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Triggers low-stock warnings on dashboard</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={form.reorderLevel}
                  onChange={(e) => setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Suggested restock point</p>
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">
                    Opening Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.initialStock}
                    onChange={(e) => setForm((f) => ({ ...f, initialStock: Number(e.target.value) }))}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Added to your default store branch</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-muted-foreground" /> Barcode (EAN / UPC / Code128)
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Scan or enter barcode number"
                  className="flex h-10 w-full font-mono rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Publication Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ACTIVE">Active (Available for POS & Sales)</option>
                  <option value="DRAFT">Draft (Hidden from billing)</option>
                  <option value="ARCHIVED">Archived (Discontinued)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
