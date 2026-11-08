"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Warehouse,
  Plus,
  ArrowRightLeft,
  ShoppingCart,
  Building,
  Globe,
  ArrowRight,
  TrendingUp,
  Boxes,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils";

interface DashboardProps {
  metrics: {
    totalPurchaseSources: number;
    activeSuppliers: number;
    totalStorageLocations: number;
    activeWarehouses: number;
  };
  recentSources: any[];
  recentLocations: any[];
}

export function StoreManagementDashboard({
  metrics,
  recentSources,
  recentLocations,
}: DashboardProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" /> Store & Source Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Independent tracking of purchase sources (where goods originate) and storage locations (where goods are stored)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/store-management/transfers/new">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowRightLeft className="w-4 h-4" /> Transfer Stock
            </Button>
          </Link>
          <Link href="/store-management/purchase-sources/new">
            <Button size="sm" variant="outline" className="gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Add Source
            </Button>
          </Link>
          <Link href="/store-management/storage-locations/new">
            <Button size="sm" className="gap-2 shadow-sm">
              <Warehouse className="w-4 h-4" /> Add Storage Location
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="kpi-gradient-blue text-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                Total Purchase Sources
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mt-2 font-mono">
              {formatNumber(metrics.totalPurchaseSources)}
            </div>
            <p className="text-[11px] text-blue-100 mt-1">
              Factories, wholesale markets & importers
            </p>
          </CardContent>
        </Card>

        <Card className="kpi-gradient-teal text-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-100 uppercase tracking-wider">
                Active Suppliers & Sources
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mt-2 font-mono">
              {formatNumber(metrics.activeSuppliers)}
            </div>
            <p className="text-[11px] text-teal-100 mt-1">
              Currently available for purchase entries
            </p>
          </CardContent>
        </Card>

        <Card className="kpi-gradient-purple text-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-100 uppercase tracking-wider">
                Total Storage Locations
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Warehouse className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mt-2 font-mono">
              {formatNumber(metrics.totalStorageLocations)}
            </div>
            <p className="text-[11px] text-purple-100 mt-1">
              Physical inventory holding facilities
            </p>
          </CardContent>
        </Card>

        <Card className="kpi-gradient-indigo text-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
                Active Warehouses
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mt-2 font-mono">
              {formatNumber(metrics.activeWarehouses)}
            </div>
            <p className="text-[11px] text-indigo-100 mt-1">
              Ready to receive stock & process transfers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Purchase Sources & Storage Locations Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Sources Section */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Purchase Sources
                </CardTitle>
                <CardDescription className="text-xs">
                  Where fabrics and textile goods are purchased
                </CardDescription>
              </div>
              <Link href="/store-management/purchase-sources">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentSources.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No purchase sources recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentSources.map((source) => (
                  <div
                    key={source.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div>
                      <Link
                        href={`/store-management/purchase-sources/${source.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors text-sm"
                      >
                        {source.sourceName}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <span className="font-mono text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                          {source.sourceCode}
                        </span>
                        <span>•</span>
                        <span>{source.sourceType}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          {source.country}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={source.status} />
                      <Link
                        href={`/store-management/purchase-sources/${source.id}`}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Locations Section */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-primary" /> Storage Locations
                </CardTitle>
                <CardDescription className="text-xs">
                  Physical stores, warehouses, and showrooms holding inventory
                </CardDescription>
              </div>
              <Link href="/store-management/storage-locations">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentLocations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No storage locations recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div>
                      <Link
                        href={`/store-management/storage-locations/${loc.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors text-sm"
                      >
                        {loc.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <span className="font-mono text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                          {loc.code}
                        </span>
                        <span>•</span>
                        <span>{loc.type}</span>
                        {loc.capacity && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-medium text-foreground">
                              {formatNumber(Number(loc.capacity))} {loc.capacityUnit || "Units"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={loc.status} />
                      <Link
                        href={`/store-management/storage-locations/${loc.id}`}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Workflow Explanation Card */}
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary" /> Purchase Source vs Storage Location Architecture
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                When recording purchases, you select both the <strong>Purchase Source</strong> (e.g. ABC Factory in Guangzhou or Islampur Stall in Dhaka) and the <strong>Destination Storage Location</strong> (e.g. Narayanganj Main Warehouse). A single purchase source can supply multiple storage locations, and each warehouse independently tracks on-hand inventory balances.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/purchases/new">
                <Button size="sm" className="gap-2 shadow-sm">
                  <ShoppingCart className="w-4 h-4" /> Record New Purchase
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

