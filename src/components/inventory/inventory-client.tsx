"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Layers,
  AlertTriangle,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Loader2,
  Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export function InventoryClient({ products, total, page, pageSize, storeId }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [search, setSearch] = React.useState(sp.get("search") ?? "");
  const totalPages = Math.ceil(total / pageSize);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [canArchive, setCanArchive] = React.useState(false);

  const update = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  };

  const totalValue = products.reduce((sum: number, p: any) => {
    const qty = Number(p.inventoryBalances?.[0]?.quantity ?? 0);
    const cost = Number(p.inventoryBalances?.[0]?.averageCost ?? p.purchaseCost ?? 0);
    return sum + qty * cost;
  }, 0);

  const handleDeleteProduct = (product: any) => {
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

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Fabric Stock &amp; Rolls
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} active fabrics &amp; rolls · Total stock valuation:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" asChild>
            <Link href="/store-management/transfers">
              Transfer Stock
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/inventory/adjustments">
              Stock Adjustment
            </Link>
          </Button>
          <Button size="sm" asChild className="gap-1.5 shadow-sm">
            <Link href="/products/new">
              <Plus className="w-4 h-4" />
              Add New Fabric
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search fabrics, SKU, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && update("search", search)}
              className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Product", "SKU", "Category", "Qty", "Avg Cost", "Stock Value", "Min Stock", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                        ["Qty", "Avg Cost", "Stock Value", "Min Stock"].includes(h)
                          ? "text-right"
                          : h === "Actions"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState icon={<Layers className="w-12 h-12" />} title="No products found" />
                  </td>
                </tr>
              ) : (
                products.map((p: any) => {
                  const qty = Number(p.inventoryBalances?.[0]?.quantity ?? 0);
                  const minStock = Number(p.minimumStock ?? 0);
                  const avgCost = Number(p.inventoryBalances?.[0]?.averageCost ?? p.purchaseCost ?? 0);
                  const stockValue = qty * avgCost;
                  const status = qty <= 0 ? "OUT_OF_STOCK" : qty <= minStock ? "LOW_STOCK" : null;
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/products/${p.id}`}
                          className="hover:text-primary transition-colors font-semibold"
                        >
                          {p.name}
                        </Link>
                        {p.storageBalances && p.storageBalances.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.storageBalances.map((sb: any) => (
                              <span
                                key={sb.id}
                                className="inline-flex items-center text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono"
                              >
                                {sb.storageLocation?.name}: {Number(sb.quantity)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">{p.productCode || p.sku}</span>
                        {p.productCode && p.sku !== p.productCode && (
                          <span className="block text-[10px] text-muted-foreground">{p.sku}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          qty <= 0 ? "text-danger" : qty <= minStock ? "text-warning" : "text-foreground"
                        }`}
                      >
                        {formatNumber(qty, 2)} {p.unit?.abbreviation}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(avgCost)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(stockValue)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatNumber(minStock, 0)} {p.unit?.abbreviation}
                      </td>
                      <td className="px-4 py-3">
                        {status ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle
                              className={`w-3 h-3 ${status === "OUT_OF_STOCK" ? "text-danger" : "text-warning"}`}
                            />
                            <StatusBadge status={status} />
                          </div>
                        ) : (
                          <span className="status-badge status-active">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="View Details">
                            <Link href={`/products/${p.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Edit Fabric">
                            <Link href={`/products/${p.id}/edit`}>
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(p)}
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => update("page", String(page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => update("page", String(page + 1))}
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
