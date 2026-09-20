import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Package, Layers, DollarSign, Barcode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `${product.name} — FabricPro` : "Fabric — FabricPro" };
}

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
      brand: true,
      unit: true,
      barcodes: true,
      inventoryBalances: {
        include: { store: { select: { name: true } } },
      },
    },
  });

  if (!product) notFound();

  const totalStock = product.inventoryBalances.reduce(
    (sum, b) => sum + Number(b.quantity),
    0
  );
  const storeStock = storeId
    ? product.inventoryBalances.find((b) => b.storeId === storeId)
    : null;
  const cost = Number(product.purchaseCost);
  const price = Number(product.sellingPrice);
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={product.status} />
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPIs */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Selling Price</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(price)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cost: {formatCurrency(cost)} · Margin:{" "}
              <span className="text-success font-semibold">{margin}%</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stock (This Store)</p>
            <p className={`text-2xl font-bold ${storeStock && Number(storeStock.quantity) <= Number(product.minimumStock) ? "text-danger" : "text-foreground"}`}>
              {formatNumber(storeStock ? Number(storeStock.quantity) : 0, 2)}{" "}
              <span className="text-sm font-normal text-muted-foreground">{product.unit?.abbreviation}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Min stock: {formatNumber(Number(product.minimumStock), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Stock (All Stores)</p>
            <p className="text-2xl font-bold text-foreground">
              {formatNumber(totalStock, 2)}{" "}
              <span className="text-sm font-normal text-muted-foreground">{product.unit?.abbreviation}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stock value: {formatCurrency(totalStock * cost)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4 text-primary" /> Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "Category", value: product.category?.name ?? "—" },
              { label: "Brand", value: product.brand?.name ?? "—" },
              { label: "Unit", value: product.unit ? `${product.unit.name} (${product.unit.abbreviation})` : "—" },
              { label: "Tax Rate", value: `${Number(product.taxRate)}%` },
              { label: "Reorder Level", value: formatNumber(Number(product.reorderLevel), 0) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
            {product.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barcodes & Inventory */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Barcode className="w-4 h-4 text-primary" /> Barcodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.barcodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No barcodes assigned</p>
              ) : (
                <div className="space-y-2">
                  {product.barcodes.map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-foreground">{b.barcode}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{b.type}</span>
                        {b.isPrimary && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Primary</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-4 h-4 text-primary" /> Stock by Store
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.inventoryBalances.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inventory records yet</p>
              ) : (
                <div className="space-y-2">
                  {product.inventoryBalances.map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{b.store.name}</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatNumber(Number(b.quantity), 2)}</span>
                        <span className="text-muted-foreground ml-1 text-xs">{product.unit?.abbreviation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
