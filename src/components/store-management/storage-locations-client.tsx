"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Warehouse,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ArrowRightLeft,
  Layers,
  FolderTree,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge, EmptyState } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { STORAGE_TYPES } from "@/lib/geo-data";

interface StorageLocationItem {
  id: string;
  name: string;
  code: string;
  type: string;
  storeManager?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  parentWarehouseId?: string | null;
  parentWarehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
  capacity?: number | string | null;
  capacityUnit?: string | null;
  country?: string | null;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  area?: string | null;
  fullAddress?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  _count?: {
    childWarehouses: number;
    purchaseOrders: number;
    inventoryBalances: number;
    transfersFrom: number;
    transfersTo: number;
  };
}

interface StorageLocationsClientProps {
  initialLocations: StorageLocationItem[];
  total: number;
  page: number;
  limit: number;
}

export function StorageLocationsClient({
  initialLocations,
  total,
  page,
  limit,
}: StorageLocationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [selectedType, setSelectedType] = React.useState(searchParams.get("type") || "ALL");
  const [selectedStatus, setSelectedStatus] = React.useState(searchParams.get("status") || "ALL");

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = React.useState<StorageLocationItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (!v || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    params.set("page", "1");
    router.push(`/store-management/storage-locations?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleReset = () => {
    setSearch("");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    router.push("/store-management/storage-locations");
  };

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/store-management/storage-locations?${params.toString()}`);
  };

  // Safe delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/store-management/storage-locations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete storage location");
        return;
      }

      toast.success(data.message || `Location "${deleteTarget.name}" deleted!`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/store-management/storage-locations/${deleteTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...deleteTarget,
          status: "INACTIVE",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deactivate");
      }

      toast.success(`Storage location "${deleteTarget.name}" marked as INACTIVE.`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" /> Storage Locations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage central warehouses, branch stores, showrooms, and factory inventory points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store-management/transfers">
            <Button variant="outline" className="gap-2">
              <ArrowRightLeft className="w-4 h-4" /> Stock Transfers
            </Button>
          </Link>
          <Link href="/store-management/storage-locations/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Add Storage Location
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by store name, code, manager, area, or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-input pl-9 pr-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  applyFilters({ type: e.target.value });
                }}
                className="h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Storage Types</option>
                {STORAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  applyFilters({ status: e.target.value });
                }}
                className="h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="h-9 gap-1 text-xs">
                Filter
              </Button>

              {(search || selectedType !== "ALL" || selectedStatus !== "ALL") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Storage Locations Table */}
      <Card>
        <CardContent className="p-0">
          {initialLocations.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Warehouse className="w-12 h-12" />}
                title="No storage locations found"
                description={
                  search || selectedType !== "ALL"
                    ? "No storage locations match the selected filters. Try clearing your search."
                    : "Create warehouses, showrooms, or storage rooms to track where inventory is physically kept."
                }
                action={
                  <Link href="/store-management/storage-locations/new">
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" /> Add Storage Location
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-left">
                    <th className="px-4 py-3">Store Name & Code</th>
                    <th className="px-4 py-3">Storage Type</th>
                    <th className="px-4 py-3">Location / Address</th>
                    <th className="px-4 py-3">Manager & Contact</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3 text-center">Stock Items</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialLocations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          {loc.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {loc.code}
                          </span>
                          {loc.parentWarehouse && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                              <FolderTree className="w-3 h-3 text-muted-foreground" />
                              Under: {loc.parentWarehouse.name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted px-2 py-0.5 rounded">
                          <Warehouse className="w-3 h-3 text-muted-foreground" />
                          {loc.type}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {[loc.area, loc.district || loc.division].filter(Boolean).join(", ") || loc.country || "—"}
                        </div>
                        {loc.fullAddress && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {loc.fullAddress}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {loc.storeManager && (
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" /> {loc.storeManager}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground">
                          {loc.contactNumber || loc.email || (!loc.storeManager ? "—" : "")}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {loc.capacity ? (
                          <span className="font-semibold font-mono text-foreground">
                            {formatNumber(Number(loc.capacity))}{" "}
                            <span className="text-[10px] font-sans font-normal text-muted-foreground">
                              {loc.capacityUnit || "Units"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">Unspecified</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                          {loc._count?.inventoryBalances ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={loc.status} />
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(loc.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/store-management/storage-locations/${loc.id}`}>
                            <button
                              title="View Details & Inventory"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/store-management/storage-locations/${loc.id}/edit`}>
                            <button
                              title="Edit Location"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            title="Delete Location"
                            onClick={() => {
                              setDeleteTarget(loc);
                              setDeleteError(null);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} locations
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="px-2 font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-md w-full shadow-2xl border-destructive/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" /> Confirm Deletion
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
              <p className="text-xs text-foreground">
                Are you sure you want to delete storage location{" "}
                <span className="font-semibold text-foreground">"{deleteTarget.name}"</span> (
                <span className="font-mono text-primary">{deleteTarget.code}</span>)?
              </p>

              {deleteError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-2">
                  <p>{deleteError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeactivateInstead}
                    disabled={deleting}
                    className="w-full text-xs gap-1 border-destructive/30 hover:bg-destructive/15 text-destructive"
                  >
                    Mark as Inactive Instead
                  </Button>
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

