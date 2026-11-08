"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Building,
  Phone,
  Mail,
  User,
  Layers,
  Edit,
  ExternalLink,
  ArrowRightLeft,
  ShoppingCart,
  CheckCircle2,
  Package,
  Activity,
  FolderTree,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";

interface StorageLocationDetailProps {
  location: any;
}

export function StorageLocationDetail({ location }: StorageLocationDetailProps) {
  const totalStockQuantity = location.inventoryBalances?.reduce(
    (sum: number, b: any) => sum + Number(b.quantity),
    0
  ) || 0;

  const capacityNum = location.capacity ? Number(location.capacity) : 0;
  const utilizationPercent =
    capacityNum > 0 ? Math.min(100, Math.round((totalStockQuantity / capacityNum) * 100)) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/store-management/storage-locations"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {location.name}
              </h1>
              <StatusBadge status={location.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {location.code}
              </span>
              <span>•</span>
              <span className="font-medium text-foreground">{location.type}</span>
              {location.parentWarehouse && (
                <>
                  <span>•</span>
                  <span>Parent: {location.parentWarehouse.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/store-management/transfers/new?sourceId=${location.id}`}>
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowRightLeft className="w-4 h-4" /> Transfer Stock
            </Button>
          </Link>
          <Link href={`/purchases/new?locationId=${location.id}`}>
            <Button size="sm" className="gap-2 shadow-sm">
              <ShoppingCart className="w-4 h-4" /> Receive Purchase Here
            </Button>
          </Link>
          <Link href={`/store-management/storage-locations/${location.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="w-4 h-4" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI & Capacity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="kpi-gradient-blue text-white">
          <CardContent className="p-4">
            <span className="text-xs text-blue-100 font-medium">Current Stock on Hand</span>
            <div className="text-2xl font-bold mt-1 font-mono">
              {formatNumber(totalStockQuantity)}
            </div>
            <span className="text-[11px] text-blue-100">
              Across {location.inventoryBalances?.length || 0} fabric/product lines
            </span>
          </CardContent>
        </Card>

        <Card className="kpi-gradient-purple text-white">
          <CardContent className="p-4">
            <span className="text-xs text-purple-100 font-medium">Total Store Capacity</span>
            <div className="text-2xl font-bold mt-1 font-mono">
              {capacityNum > 0 ? formatNumber(capacityNum) : "Unspecified"}
            </div>
            <span className="text-[11px] text-purple-100">
              {location.capacityUnit || "Standard Units"}
            </span>
          </CardContent>
        </Card>

        <Card className="kpi-gradient-teal text-white">
          <CardContent className="p-4">
            <span className="text-xs text-teal-100 font-medium">Capacity Utilization</span>
            <div className="text-2xl font-bold mt-1 font-mono">
              {utilizationPercent !== null ? `${utilizationPercent}%` : "N/A"}
            </div>
            {utilizationPercent !== null && (
              <div className="w-full bg-white/30 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all"
                  style={{ width: `${utilizationPercent}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="kpi-gradient-indigo text-white">
          <CardContent className="p-4">
            <span className="text-xs text-indigo-100 font-medium">Facility Manager</span>
            <div className="text-base font-bold mt-1 truncate">
              {location.storeManager || "Unassigned"}
            </div>
            <span className="text-[11px] text-indigo-100 truncate block">
              {location.contactNumber || location.email || "No direct phone"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Location & Facility Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Facility Location & Address
                </span>
                {location.googleMapsLocation && (
                  <a
                    href={location.googleMapsLocation}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                  >
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Country</span>
                  <span className="font-semibold text-foreground">{location.country || "Bangladesh"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Division</span>
                  <span className="font-medium text-foreground">{location.division || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">District</span>
                  <span className="font-medium text-foreground">{location.district || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Upazila / Thana</span>
                  <span className="font-medium text-foreground">{location.upazila || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Area / Neighborhood</span>
                  <span className="font-medium text-foreground">{location.area || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Building & Floor</span>
                  <span className="font-medium text-foreground">
                    {[location.buildingName, location.floorNumber].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
              </div>

              {location.fullAddress && (
                <div className="p-3 bg-muted/40 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-1 font-semibold uppercase">
                    Full Physical Address
                  </span>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {location.fullAddress}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Inventory at this Location */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Inventory Stored at this Location
                </CardTitle>
                <Link
                  href={`/inventory?search=${location.name}`}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Manage Stock →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {location.inventoryBalances && location.inventoryBalances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                        <th className="px-4 py-3">Product / Fabric</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">In Stock</th>
                        <th className="px-4 py-3 text-right">Avg Unit Cost</th>
                        <th className="px-4 py-3 text-right">Est. Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {location.inventoryBalances.map((bal: any) => {
                        const qty = Number(bal.quantity);
                        const cost = Number(bal.averageCost || bal.product?.purchaseCost || 0);
                        const totalVal = qty * cost;
                        return (
                          <tr key={bal.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium text-foreground">
                              {bal.product?.name || "Product"}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                              {bal.product?.sku || "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {bal.product?.category?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                              {formatNumber(qty)}{" "}
                              <span className="text-[10px] font-sans font-normal text-muted-foreground">
                                {bal.product?.unit?.abbreviation || ""}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                              {formatCurrency(cost)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                              {formatCurrency(totalVal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No products in stock at this storage location yet. Receive a purchase or transfer stock here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Operational Notes & Sub-warehouses */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary" /> Facility Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Storage Type</span>
                <span className="font-semibold text-foreground text-sm">{location.type}</span>
              </div>

              {location.description && (
                <div>
                  <span className="text-muted-foreground block mb-0.5">Description</span>
                  <p className="text-foreground leading-relaxed">{location.description}</p>
                </div>
              )}

              {location.notes && (
                <div>
                  <span className="text-muted-foreground block mb-0.5">Internal Notes</span>
                  <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border leading-relaxed">
                    {location.notes}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-border flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Created On</span>
                <span className="font-medium text-foreground">{formatDate(location.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Child Sub-Warehouses if any */}
          {location.childWarehouses && location.childWarehouses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-primary" /> Nested Sub-Locations
                </CardTitle>
                <CardDescription className="text-xs">
                  Branches or showrooms attached to this central facility
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  {location.childWarehouses.map((cw: any) => (
                    <div key={cw.id} className="p-3 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <Link
                          href={`/store-management/storage-locations/${cw.id}`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {cw.name}
                        </Link>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {cw.code} • {cw.type}
                        </div>
                      </div>
                      <StatusBadge status={cw.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Stock Movements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Recent Stock Movements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {location.stockMovements && location.stockMovements.length > 0 ? (
                <div className="divide-y divide-border text-xs">
                  {location.stockMovements.map((m: any) => (
                    <div key={m.id} className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {m.product?.name || "Product"}
                        </span>
                        <span
                          className={`font-mono font-semibold ${
                            Number(m.quantity) >= 0 ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {Number(m.quantity) > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="bg-muted px-1.5 py-0.5 rounded font-medium">
                          {m.type}
                        </span>
                        <span>{formatDate(m.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No stock movements recorded yet at this facility.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

