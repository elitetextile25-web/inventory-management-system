"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus, Search, Filter, Package, Edit2, Archive, Eye, Barcode, Download, Trash2, AlertCircle, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState, Skeleton } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
  id: string;
  sku: string;
  name: string;
  status: string;
  purchaseCost: any;
  sellingPrice: any;
  minimumStock: any;
  category?: { name: string } | null;
  subcategory?: { name: string } | null;
  shop?: { name: string } | null;
  brand?: { name: string } | null;
  unit?: { abbreviation: string } | null;
  inventoryBalances?: { quantity: any }[];
  barcodes?: { barcode: string }[];
}

interface ProductsClientProps {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  categories: { id: string; name: string }[];
  storeId?: string;
}

export function ProductsClient({
  products,
  total,
  page,
  pageSize,
  categories,
  storeId,
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");

  const updateSearch = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const [exporting, setExporting] = React.useState(false);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [canArchive, setCanArchive] = React.useState(false);

  const handleDeleteProduct = (product: Product) => {
    setDeleteTarget(product);
    setDeleteError(null);
    setCanArchive(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete product");
        if (data.canArchive) {
          setCanArchive(true);
        }
        return;
      }

      toast.success(data.message || `Product "${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveInstead = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive product");
      }

      toast.success(`Product "${deleteTarget.name}" archived successfully!`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to archive product");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch("/api/products/export");

      if (!res.ok) {
        toast.error("Failed to generate Excel export");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "FabricPro_Catalog.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Downloaded catalog Excel file!");
    } catch {
      toast.error("Failed to export products");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fabrics &amp; Products</h1>
          <p className="text-sm text-muted-foreground">{total} fabrics in catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export .xlsx"}
          </Button>
          <Button size="sm" asChild>
            <Link href="/products/new">
              <Plus className="w-4 h-4" />
              Add Fabric
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, SKU, barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateSearch("search", search)}
                className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchParams.get("category") ?? ""}
              onChange={(e) => updateSearch("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchParams.get("status") ?? ""}
              onChange={(e) => updateSearch("status", e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Package className="w-12 h-12" />}
                      title="No products found"
                      description="Add your first product or adjust the search filters."
                      action={
                        <Button size="sm" asChild>
                          <Link href="/products/new">
                            <Plus className="w-4 h-4" />
                            Add Product
                          </Link>
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = Number(product.inventoryBalances?.[0]?.quantity ?? 0);
                  const minStock = Number(product.minimumStock ?? 0);
                  const stockStatus =
                    stock <= 0 ? "OUT_OF_STOCK" :
                    stock <= minStock ? "LOW_STOCK" : null;

                  const margin = Number(product.sellingPrice) > 0
                    ? (((Number(product.sellingPrice) - Number(product.purchaseCost)) / Number(product.sellingPrice)) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            {product.brand && (
                              <p className="text-xs text-muted-foreground">{product.brand.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        <div className="font-medium text-foreground">{product.category?.name ?? "—"}</div>
                        {product.subcategory && (
                          <div className="text-xs text-muted-foreground">↳ {product.subcategory.name}</div>
                        )}
                        {product.shop && (
                          <div className="text-[11px] text-primary font-medium flex items-center gap-0.5 mt-0.5">
                            📍 {product.shop.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.purchaseCost)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(product.sellingPrice)}</span>
                        <br />
                        <span className="text-xs text-success">{margin}% margin</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`font-semibold ${stock <= 0 ? "text-danger" : stock <= minStock ? "text-warning" : "text-foreground"}`}>
                            {formatNumber(stock, 2)} {product.unit?.abbreviation}
                          </span>
                          {stockStatus && <StatusBadge status={stockStatus} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/products/${product.id}`} title="View">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/products/${product.id}/edit`} title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product)}
                            title="Delete Product"
                            className="text-muted-foreground hover:text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateSearch("page", String(page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateSearch("page", String(page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-md w-full shadow-2xl border-danger/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-danger flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-danger" /> Confirm Delete Product
                </CardTitle>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                Are you sure you want to delete product{" "}
                <span className="font-semibold text-foreground">"{deleteTarget.name}"</span> (
                <span className="font-mono text-primary">{deleteTarget.sku}</span>)?
              </p>

              {deleteError && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger space-y-2">
                  <p>{deleteError}</p>
                  {canArchive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleArchiveInstead}
                      disabled={deleting}
                      className="w-full text-xs gap-1 border-danger/30 hover:bg-danger/15 text-danger"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive Product Instead
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
