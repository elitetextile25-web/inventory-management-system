import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit2,
  Package,
  Layers,
  DollarSign,
  Barcode,
  Palette,
  Scale,
  Ruler,
  Warehouse,
  Truck,
  Percent,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ShoppingBag,
  Activity,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { ProductDeleteButton } from "@/components/products/product-delete-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, productCode: true, sku: true },
  });
  const code = product?.productCode || product?.sku || "";
  return {
    title: product ? `${product.name} (${code}) — FabricPro` : "Product Details — FabricPro",
  };
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

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const storeId = (session?.user as any)?.storeId;
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, organizationId },
    include: {
      category: true,
      subcategory: true,
      brand: true,
      unit: true,
      barcodes: true,
      storageLocation: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      colors: { include: { color: true } },
      supplierProducts: {
        include: { supplier: true },
      },
      inventoryBalances: {
        include: { store: { select: { id: true, name: true } } },
      },
      storageBalances: {
        include: {
          storageLocation: {
            select: { id: true, name: true, code: true, type: true },
          },
        },
      },
      stockMovements: {
        take: 15,
        orderBy: { createdAt: "desc" },
      },
      purchaseItems: {
        take: 10,
        include: {
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              orderDate: true,
              status: true,
              supplier: { select: { name: true } },
            },
          },
        },
        orderBy: { purchaseOrder: { orderDate: "desc" } },
      },
      saleItems: {
        take: 10,
        include: {
          sale: {
            select: {
              id: true,
              invoiceNumber: true,
              saleDate: true,
              status: true,
              grandTotal: true,
            },
          },
        },
        orderBy: { sale: { saleDate: "desc" } },
      },
    },
  });

  if (!product) notFound();

  // Inventory Stock Calculations
  const totalStock = product.inventoryBalances.reduce(
    (sum, b) => sum + Number(b.quantity),
    0
  );
  const storeStock = storeId
    ? product.inventoryBalances.find((b) => b.storeId === storeId)
    : null;

  // Financial Calculations
  const cost = Number(product.purchaseCost);
  const regularPrice = Number(product.sellingPrice);
  const finalPrice = product.finalSellingPrice ? Number(product.finalSellingPrice) : regularPrice;
  const hasDiscount =
    product.discountType &&
    product.discountType !== "NONE" &&
    Number(product.discountValue) > 0;
  const profitPerUnit = finalPrice - cost;
  const profitMarginPercent =
    finalPrice > 0 ? (((finalPrice - cost) / finalPrice) * 100).toFixed(1) : "0.0";
  const stockValuation = totalStock * cost;

  const displayCode = product.productCode || product.sku;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Back to product catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                {displayCode}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                {PRODUCT_TYPE_LABELS[product.productType] || product.productType}
              </span>
              <StatusBadge status={product.status} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              SKU: {product.sku} {product.brand && `· Brand: ${product.brand.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/inventory/adjustments/new"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Adjust Stock
          </Link>
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Product
          </Link>
          <ProductDeleteButton
            productId={product.id}
            productName={product.name}
            productSku={displayCode}
          />
        </div>
      </div>

      {/* Image Gallery Showcase */}
      {product.images && product.images.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider font-semibold">
              <Package className="w-4 h-4 text-primary" /> Product Visuals ({product.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {product.images.map((img, i) => (
                <div
                  key={img.id}
                  className="relative rounded-lg border border-border overflow-hidden bg-muted/20 h-28 flex items-center justify-center group"
                >
                  <img
                    src={img.url}
                    alt={`${product.name} view ${i + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/200x200?text=Image";
                    }}
                  />
                  {img.isPrimary && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Selling Price */}
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Selling Price</p>
            <p className="text-xl font-bold text-primary mt-1">{formatCurrency(finalPrice)}</p>
            {hasDiscount && (
              <p className="text-[10px] text-muted-foreground line-through mt-0.5">
                Reg: {formatCurrency(regularPrice)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Buying Price */}
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Buying Cost</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(cost)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">per unit</p>
          </CardContent>
        </Card>

        {/* Profit Per Unit */}
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Profit / Unit</p>
            <p
              className={`text-xl font-bold mt-1 ${
                profitPerUnit >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {profitPerUnit >= 0 ? "+" : ""}
              {formatCurrency(profitPerUnit)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Estimated gross</p>
          </CardContent>
        </Card>

        {/* Margin */}
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Profit Margin</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-xl font-bold ${
                  Number(profitMarginPercent) >= 15
                    ? "text-success"
                    : Number(profitMarginPercent) >= 0
                    ? "text-warning"
                    : "text-danger"
                }`}
              >
                {profitMarginPercent}%
              </span>
              {Number(profitMarginPercent) >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-danger" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">On final price</p>
          </CardContent>
        </Card>

        {/* Total Stock */}
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Total Stock</p>
            <p
              className={`text-xl font-bold mt-1 ${
                totalStock <= 0
                  ? "text-danger"
                  : totalStock <= Number(product.minimumStock)
                  ? "text-warning"
                  : "text-foreground"
              }`}
            >
              {formatNumber(totalStock, 2)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {product.unit?.abbreviation || "Pcs"}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Min: {formatNumber(Number(product.minimumStock), 0)}
            </p>
          </CardContent>
        </Card>

        {/* Valuation */}
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase">Stock Valuation</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {formatCurrency(stockValuation)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Asset value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Specifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Product Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {[
              { label: "Product Code", value: displayCode, isMono: true },
              { label: "SKU / Barcode", value: product.sku, isMono: true },
              { label: "Category", value: product.category?.name ?? "—" },
              { label: "Subcategory", value: product.subcategory?.name ?? "—" },
              {
                label: "Product Type",
                value: PRODUCT_TYPE_LABELS[product.productType] || product.productType,
              },
              {
                label: "Colors",
                value:
                  product.colors && product.colors.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {product.colors.map((cm) => (
                        <span
                          key={cm.color.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[11px] bg-muted/40 font-medium"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: cm.color.hexCode || "#999" }}
                          />
                          {cm.color.name}
                        </span>
                      ))}
                    </div>
                  ) : product.color ? (
                    product.color
                  ) : (
                    "—"
                  ),
              },
              {
                label: "Measurement Unit",
                value: product.unit
                  ? `${product.unit.name} (${product.unit.abbreviation})`
                  : "—",
              },
              {
                label: "Weight",
                value: product.weight
                  ? `${Number(product.weight)} ${product.weightUnit || "KG"}`
                  : "—",
              },
              {
                label: "Length in Meters",
                value: product.lengthInMeters ? `${Number(product.lengthInMeters)} m` : "—",
              },
              {
                label: "Rack & Shelf Location",
                value:
                  product.rackNumber || product.shelfNumber
                    ? `Rack: ${product.rackNumber || "—"}, Shelf: ${product.shelfNumber || "—"}`
                    : "—",
              },
              { label: "VAT / Tax Rate", value: `${Number(product.taxRate)}%` },
              {
                label: "Created Date",
                value: formatDate(product.createdAt),
              },
              {
                label: "Last Updated",
                value: formatDate(product.updatedAt),
              },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`font-medium text-foreground ${row.isMono ? "font-mono" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}

            {product.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground mb-1 font-semibold">Description / Blend Notes:</p>
                <p className="text-foreground leading-relaxed">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warehouses & Storage Locations */}
        <div className="space-y-4">
          {/* Storage Locations */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-primary" /> Warehouse &amp; Storage Balances
                </CardTitle>
                <CardDescription>
                  Inventory stock distributed across warehouses, showrooms, and branches.
                </CardDescription>
              </div>
              <Link
                href="/store-management/transfers/new"
                className="text-xs text-primary font-medium hover:underline"
              >
                Transfer →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.storageBalances.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border">
                  No warehouse storage balances allocated yet. Stock is recorded in store ledger.
                </div>
              ) : (
                <div className="space-y-2">
                  {product.storageBalances.map((sb) => (
                    <div
                      key={sb.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {sb.storageLocation.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {sb.storageLocation.code} · {sb.storageLocation.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-sm text-foreground">
                          {formatNumber(Number(sb.quantity), 2)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {product.unit?.abbreviation || "units"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" /> Associated Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.supplierProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No suppliers linked to this product.</p>
              ) : (
                <div className="space-y-2">
                  {product.supplierProducts.map((sp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-border bg-card"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{sp.supplier.name}</p>
                        {sp.supplier.company && (
                          <p className="text-[11px] text-muted-foreground">{sp.supplier.company}</p>
                        )}
                        {sp.purchaseReference && (
                          <p className="text-[10px] font-mono text-primary mt-0.5">
                            Ref: {sp.purchaseReference}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {sp.isDefault && (
                          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                        {sp.supplier.phone && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {sp.supplier.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Stock Movements & Transaction Logs */}
      <div className="space-y-4">
        {/* Recent Stock Movement History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Stock Movements &amp; Audits
            </CardTitle>
            <CardDescription>
              Chronological ledger of inventory additions, transfers, sales deductions, and recounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                    <th className="px-4 py-2.5">Date &amp; Time</th>
                    <th className="px-4 py-2.5">Movement Type</th>
                    <th className="px-4 py-2.5 text-right">Quantity</th>
                    <th className="px-4 py-2.5 text-right">Unit Cost</th>
                    <th className="px-4 py-2.5">Reference &amp; Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {product.stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground">
                        No recorded stock movements yet.
                      </td>
                    </tr>
                  ) : (
                    product.stockMovements.map((sm) => (
                      <tr key={sm.id} className="hover:bg-muted/15">
                        <td className="px-4 py-2 text-muted-foreground">
                          {formatDate(sm.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          <span className="font-semibold px-2 py-0.5 rounded bg-muted">
                            {sm.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold">
                          {formatNumber(Number(sm.quantity), 2)} {product.unit?.abbreviation}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatCurrency(Number(sm.unitCost))}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground max-w-[250px] truncate">
                          {sm.notes || sm.referenceType || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
