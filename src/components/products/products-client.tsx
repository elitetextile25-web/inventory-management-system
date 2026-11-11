"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Package,
  Edit2,
  Archive,
  Eye,
  Barcode,
  Download,
  Trash2,
  AlertCircle,
  X,
  Loader2,
  Copy,
  Layers,
  Scale,
  Sparkles,
  ChevronDown,
  Warehouse,
  Truck,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
  id: string;
  sku: string;
  productCode?: string | null;
  name: string;
  productType?: string;
  color?: string | null;
  status: string;
  purchaseCost: any;
  sellingPrice: any;
  discountType?: string;
  discountValue?: any;
  finalSellingPrice?: any;
  minimumStock: any;
  imageUrl?: string | null;
  images?: { url: string; isPrimary: boolean }[];
  category?: { id?: string; name: string } | null;
  subcategory?: { id?: string; name: string } | null;
  shop?: { name: string } | null;
  brand?: { name: string } | null;
  unit?: { name?: string; abbreviation: string } | null;
  storageLocation?: { id: string; name: string; code: string; type: string } | null;
  colors?: { color: { id: string; name: string; hexCode?: string | null } }[];
  supplierProducts?: { supplier: { id: string; name: string } }[];
  inventoryBalances?: { store?: { name: string }; quantity: any }[];
  storageBalances?: { storageLocation: { name: string; code: string }; quantity: any }[];
  barcodes?: { barcode: string }[];
}

interface ProductsClientProps {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  categories: { id: string; name: string; children?: { id: string; name: string }[] }[];
  units?: { id: string; name: string; abbreviation: string }[];
  storageLocations?: { id: string; name: string; code: string; type: string }[];
  suppliers?: { id: string; name: string; company?: string | null }[];
  colors?: { id: string; name: string; hexCode?: string | null }[];
  storeId?: string;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  FINISHED_PRODUCT: "Finished Product",
  FABRIC: "Fabric",
  ORDER: "Order",
  KNITTING: "Knitting",
  RAW_MATERIAL: "Raw Material",
  ACCESSORIES: "Accessories",
  CUSTOM: "Custom",
};

export function ProductsClient({
  products,
  total,
  page,
  pageSize,
  categories,
  units = [],
  storageLocations = [],
  suppliers = [],
  colors = [],
  storeId,
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search & Filter State
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [showFilters, setShowFilters] = React.useState(false);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [canArchive, setCanArchive] = React.useState(false);

  // Duplicating state
  const [duplicatingId, setDuplicatingId] = React.useState<string | null>(null);

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (!v || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSearch("");
    router.push(pathname);
  };

  const [exporting, setExporting] = React.useState(false);
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
      a.download = "FabricPro_Products_Catalog.xlsx";
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

  // Duplicate product handler
  const handleDuplicateProduct = async (product: Product) => {
    setDuplicatingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to duplicate product");
      }
      toast.success(data.message || `Product duplicated with code ${data.data.productCode}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate product");
    } finally {
      setDuplicatingId(null);
    }
  };

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

  const totalPages = Math.ceil(total / pageSize);

  // Active filter checks
  const currentCategory = searchParams.get("category") || "ALL";
  const currentSubcategory = searchParams.get("subcategory") || "ALL";
  const currentProductType = searchParams.get("productType") || "ALL";
  const currentColor = searchParams.get("color") || "ALL";
  const currentUnit = searchParams.get("unit") || "ALL";
  const currentWarehouse = searchParams.get("warehouse") || "ALL";
  const currentSupplier = searchParams.get("supplier") || "ALL";
  const currentStockStatus = searchParams.get("stockStatus") || "ALL";
  const currentStatus = searchParams.get("status") || "ALL";

  const hasActiveFilters =
    search ||
    currentCategory !== "ALL" ||
    currentSubcategory !== "ALL" ||
    currentProductType !== "ALL" ||
    currentColor !== "ALL" ||
    currentUnit !== "ALL" ||
    currentWarehouse !== "ALL" ||
    currentSupplier !== "ALL" ||
    currentStockStatus !== "ALL" ||
    currentStatus !== "ALL";

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Fabrics &amp; Garments Catalog
          </h1>
          <p className="text-xs text-muted-foreground">
            {total} products recorded · Unique codes, pricing calculations, colors &amp; warehouse inventory
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
          <Button size="sm" asChild className="gap-1.5 shadow-sm">
            <Link href="/products/new">
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Product Name, Code (e.g. TSH-000001), SKU, or Barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateFilters({ search })}
                className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Category */}
              <select
                value={currentCategory}
                onChange={(e) =>
                  updateFilters({ category: e.target.value, subcategory: "ALL" })
                }
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Product Type */}
              <select
                value={currentProductType}
                onChange={(e) => updateFilters({ productType: e.target.value })}
                className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Product Types</option>
                {Object.entries(PRODUCT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Toggle Advanced Filters */}
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 gap-1 text-xs"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filter Drawer */}
          {showFilters && (
            <div className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 animate-fade-in">
              {/* Color */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Color
                </label>
                <select
                  value={currentColor}
                  onChange={(e) => updateFilters({ color: e.target.value })}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                >
                  <option value="ALL">All Colors</option>
                  {colors.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Unit
                </label>
                <select
                  value={currentUnit}
                  onChange={(e) => updateFilters({ unit: e.target.value })}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                >
                  <option value="ALL">All Units</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Stock Status
                </label>
                <select
                  value={currentStockStatus}
                  onChange={(e) => updateFilters({ stockStatus: e.target.value })}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              {/* Warehouse */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Warehouse
                </label>
                <select
                  value={currentWarehouse}
                  onChange={(e) => updateFilters({ warehouse: e.target.value })}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                >
                  <option value="ALL">All Warehouses</option>
                  {storageLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Supplier
                </label>
                <select
                  value={currentSupplier}
                  onChange={(e) => updateFilters({ supplier: e.target.value })}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                >
                  <option value="ALL">All Suppliers</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Status */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Catalog Status
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => updateFilters({ status: e.target.value })}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Listing Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase text-left">
                <th className="px-3 py-3 w-[50px]">Image</th>
                <th className="px-3 py-3 w-[120px]">Product Code</th>
                <th className="px-4 py-3 min-w-[200px]">Product Name &amp; SKU</th>
                <th className="px-3 py-3 min-w-[130px]">Category</th>
                <th className="px-3 py-3 min-w-[120px]">Type</th>
                <th className="px-3 py-3 w-[90px]">Color</th>
                <th className="px-3 py-3 text-right w-[110px]">Buying (৳)</th>
                <th className="px-3 py-3 text-right w-[120px]">Selling (৳)</th>
                <th className="px-3 py-3 text-right min-w-[130px]">Available Stock</th>
                <th className="px-3 py-3 min-w-[130px]">Warehouse</th>
                <th className="px-3 py-3 text-center w-[80px]">Status</th>
                <th className="px-3 py-3 text-right w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12">
                    <EmptyState
                      icon={<Package className="w-12 h-12" />}
                      title="No products found"
                      description={
                        hasActiveFilters
                          ? "Try clearing some filters or refining your search."
                          : "Get started by adding your first clothing, T-shirt, or fabric product."
                      }
                      action={
                        <Button size="sm" asChild className="gap-1.5 mt-2">
                          <Link href="/products/new">
                            <Plus className="w-4 h-4" /> Add Product
                          </Link>
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock =
                    product.inventoryBalances?.reduce(
                      (sum, b) => sum + Number(b.quantity),
                      0
                    ) ?? 0;
                  const minStock = Number(product.minimumStock) || 0;
                  const cost = Number(product.purchaseCost);
                  const regPrice = Number(product.sellingPrice);
                  const effectivePrice = product.finalSellingPrice
                    ? Number(product.finalSellingPrice)
                    : regPrice;
                  const hasDiscount =
                    product.discountType &&
                    product.discountType !== "NONE" &&
                    Number(product.discountValue) > 0;

                  const stockStatus =
                    stock <= 0 ? "OUT_OF_STOCK" : stock <= minStock ? "LOW_STOCK" : "IN_STOCK";

                  const displayCode = product.productCode || product.sku;
                  const primaryImg =
                    product.imageUrl || product.images?.[0]?.url;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Image Thumbnail */}
                      <td className="px-3 py-2.5">
                        <div className="w-10 h-10 rounded-md bg-muted/60 border border-border overflow-hidden flex items-center justify-center shrink-0">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                      </td>

                      {/* Product Code */}
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs font-bold text-primary block">
                          {displayCode}
                        </span>
                      </td>

                      {/* Product Name & SKU */}
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/products/${product.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-mono">SKU: {product.sku}</span>
                          {product.brand && <span>· {product.brand.name}</span>}
                        </div>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-medium text-foreground block">
                          {product.category?.name ?? "—"}
                        </span>
                        {product.subcategory && (
                          <span className="text-[10px] text-muted-foreground block">
                            ↳ {product.subcategory.name}
                          </span>
                        )}
                      </td>

                      {/* Product Type */}
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted/80 text-foreground border border-border/50">
                          {PRODUCT_TYPE_LABELS[product.productType || "FINISHED_PRODUCT"] ||
                            product.productType}
                        </span>
                      </td>

                      {/* Color */}
                      <td className="px-3 py-2.5">
                        {product.colors && product.colors.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {product.colors.slice(0, 3).map((cm, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: cm.color.hexCode || "#999" }}
                                title={cm.color.name}
                              />
                            ))}
                            {product.colors.length > 3 && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                +{product.colors.length - 3}
                              </span>
                            )}
                          </div>
                        ) : product.color ? (
                          <span className="text-xs text-foreground">{product.color}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Buying Price */}
                      <td className="px-3 py-2.5 text-right font-medium text-xs">
                        {formatCurrency(cost)}
                      </td>

                      {/* Selling Price & Discount */}
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold text-foreground text-xs block">
                          {formatCurrency(effectivePrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[10px] text-muted-foreground line-through block">
                            {formatCurrency(regPrice)}
                          </span>
                        )}
                      </td>

                      {/* Available Stock */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`font-bold font-mono text-xs ${
                              stock <= 0
                                ? "text-danger"
                                : stock <= minStock
                                ? "text-warning"
                                : "text-foreground"
                            }`}
                          >
                            {formatNumber(stock, 2)} {product.unit?.abbreviation || "Pcs"}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              stock <= 0
                                ? "bg-danger"
                                : stock <= minStock
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                            title={
                              stock <= 0 ? "Out of Stock" : stock <= minStock ? "Low Stock" : "In Stock"
                            }
                          />
                        </div>
                      </td>

                      {/* Warehouse / Location */}
                      <td className="px-3 py-2.5">
                        {product.storageLocation ? (
                          <div>
                            <span className="text-xs font-medium text-foreground block">
                              {product.storageLocation.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground block">
                              {product.storageLocation.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge status={product.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <Button variant="ghost" size="icon" asChild title="View Details">
                            <Link href={`/products/${product.id}`}>
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          {/* Edit Product */}
                          <Button variant="ghost" size="icon" asChild title="Edit Product">
                            <Link href={`/products/${product.id}/edit`}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          {/* Duplicate Product */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={duplicatingId === product.id}
                            onClick={() => handleDuplicateProduct(product)}
                            title="Duplicate Product"
                          >
                            {duplicatingId === product.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            )}
                          </Button>

                          {/* Adjust Stock */}
                          <Button variant="ghost" size="icon" asChild title="Adjust Stock">
                            <Link href={`/inventory/adjustments/new`}>
                              <Layers className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Link>
                          </Button>

                          {/* Delete Product */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product)}
                            title="Delete Product"
                            className="text-muted-foreground hover:text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} products
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: String(page + 1) })}
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
                <span className="font-mono text-primary">
                  {deleteTarget.productCode || deleteTarget.sku}
                </span>
                )?
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
