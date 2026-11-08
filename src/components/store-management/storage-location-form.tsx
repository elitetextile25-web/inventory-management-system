"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  Save,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BANGLADESH_DIVISIONS,
  COMMON_COUNTRIES,
  STORAGE_TYPES,
  CAPACITY_UNITS,
} from "@/lib/geo-data";

export interface StorageLocationFormData {
  id?: string;
  name: string;
  code?: string;
  type: string;
  storeManager: string;
  contactNumber: string;
  email: string;
  parentWarehouseId: string;
  capacity: string | number;
  capacityUnit: string;
  country: string;
  division: string;
  district: string;
  upazila: string;
  area: string;
  streetRoad: string;
  buildingName: string;
  floorNumber: string;
  fullAddress: string;
  googleMapsLocation: string;
  description: string;
  notes: string;
  status: "ACTIVE" | "INACTIVE";
}

interface StorageLocationFormProps {
  initialData?: StorageLocationFormData | null;
  isEdit?: boolean;
  warehousesList?: { id: string; name: string; code: string }[];
}

export function StorageLocationForm({
  initialData,
  isEdit = false,
  warehousesList = [],
}: StorageLocationFormProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  const [formData, setFormData] = React.useState<StorageLocationFormData>({
    id: initialData?.id || "",
    name: initialData?.name || "",
    code: initialData?.code || "",
    type: initialData?.type || "Main Warehouse",
    storeManager: initialData?.storeManager || "",
    contactNumber: initialData?.contactNumber || "",
    email: initialData?.email || "",
    parentWarehouseId: initialData?.parentWarehouseId || "",
    capacity: initialData?.capacity !== undefined && initialData?.capacity !== null ? initialData.capacity : "",
    capacityUnit: initialData?.capacityUnit || "Pieces",
    country: initialData?.country || "Bangladesh",
    division: initialData?.division || "Dhaka",
    district: initialData?.district || "Dhaka",
    upazila: initialData?.upazila || "",
    area: initialData?.area || "",
    streetRoad: initialData?.streetRoad || "",
    buildingName: initialData?.buildingName || "",
    floorNumber: initialData?.floorNumber || "",
    fullAddress: initialData?.fullAddress || "",
    googleMapsLocation: initialData?.googleMapsLocation || "",
    description: initialData?.description || "",
    notes: initialData?.notes || "",
    status: initialData?.status || "ACTIVE",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isBangladesh = formData.country.toLowerCase() === "bangladesh";

  const currentDivisionObj = React.useMemo(() => {
    return BANGLADESH_DIVISIONS.find(
      (d) => d.name.toLowerCase() === formData.division.toLowerCase()
    );
  }, [formData.division]);

  const availableDistricts = React.useMemo(() => {
    return currentDivisionObj?.districts || [];
  }, [currentDivisionObj]);

  const currentDistrictObj = React.useMemo(() => {
    return availableDistricts.find(
      (dist) => dist.name.toLowerCase() === formData.district.toLowerCase()
    );
  }, [availableDistricts, formData.district]);

  const availableUpazilas = React.useMemo(() => {
    return currentDistrictObj?.upazilas || [];
  }, [currentDistrictObj]);

  const updateField = (field: keyof StorageLocationFormData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "division" && isBangladesh) {
        const divObj = BANGLADESH_DIVISIONS.find(
          (d) => d.name.toLowerCase() === String(value).toLowerCase()
        );
        const firstDist = divObj?.districts[0]?.name || "";
        next.district = firstDist;
        next.upazila = divObj?.districts[0]?.upazilas?.[0] || "";
      }
      if (field === "district" && isBangladesh) {
        const distObj = availableDistricts.find(
          (d) => d.name.toLowerCase() === String(value).toLowerCase()
        );
        next.upazila = distObj?.upazilas?.[0] || "";
      }
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Store name is required";
    }
    if (!formData.type) {
      newErrors.type = "Store type is required";
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields properly");
      return;
    }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/store-management/storage-locations/${initialData?.id}`
        : "/api/store-management/storage-locations";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        capacity: formData.capacity === "" ? null : Number(formData.capacity),
        parentWarehouseId: formData.parentWarehouseId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save storage location");
      }

      toast.success(
        isEdit
          ? `Location "${formData.name}" updated!`
          : `Storage location "${formData.name}" registered successfully!`,
        { icon: "🏢" }
      );

      router.push("/store-management/storage-locations");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEdit ? "Edit Storage Location" : "Add Storage Location"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define physical warehouses, storage rooms, factory stores, or showroom inventory points
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store-management/storage-locations">
            <Button variant="outline" type="button" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2 shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Location" : "Save Storage Location"}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-primary" /> Basic Information
          </CardTitle>
          <CardDescription className="text-xs">
            Physical store identity, type, hierarchy, and storage capacity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Store / Warehouse Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Narayanganj Main Warehouse or Gulshan Showroom Stock"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={`w-full h-9 rounded-lg border px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.name ? "border-destructive" : "border-input"
                }`}
              />
              {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Store Code
              </label>
              <input
                type="text"
                disabled
                value={formData.code || "(Auto-generated e.g. LOC-000001)"}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-muted/60 text-muted-foreground font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Unique identifier generated upon creation
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Storage Type <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STORAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Parent Warehouse (optional)
              </label>
              <select
                value={formData.parentWarehouseId}
                onChange={(e) => updateField("parentWarehouseId", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">None (Top-Level Central Warehouse)</option>
                {warehousesList
                  .filter((w) => w.id !== initialData?.id)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Used for nested storage locations (e.g. showroom under main warehouse)
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Store Manager / In-Charge
              </label>
              <input
                type="text"
                placeholder="e.g. Tanvir Ahmed"
                value={formData.storeManager}
                onChange={(e) => updateField("storeManager", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Contact Number
              </label>
              <input
                type="text"
                placeholder="e.g. +880 1711 223344"
                value={formData.contactNumber}
                onChange={(e) => updateField("contactNumber", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. warehouse.nrj@company.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={`w-full h-9 rounded-lg border px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.email ? "border-destructive" : "border-input"
                }`}
              />
              {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email}</p>}
            </div>

            {/* Capacity & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Capacity (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 50000"
                  value={formData.capacity}
                  onChange={(e) => updateField("capacity", e.target.value)}
                  className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Capacity Unit
                </label>
                <select
                  value={formData.capacityUnit}
                  onChange={(e) => updateField("capacityUnit", e.target.value)}
                  className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CAPACITY_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Physical Location & Address
          </CardTitle>
          <CardDescription className="text-xs">
            Geographic coordinates and building address for delivery logistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {COMMON_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {isBangladesh ? (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Division (বিভাগ)
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => updateField("division", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {BANGLADESH_DIVISIONS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    District (জেলা)
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => updateField("district", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {availableDistricts.map((dist) => (
                      <option key={dist.name} value={dist.name}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Upazila / Thana
                  </label>
                  {availableUpazilas.length > 0 ? (
                    <select
                      value={formData.upazila}
                      onChange={(e) => updateField("upazila", e.target.value)}
                      className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select Upazila</option>
                      {availableUpazilas.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Narayanganj Sadar"
                      value={formData.upazila}
                      onChange={(e) => updateField("upazila", e.target.value)}
                      className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    State / Province
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. State or Province"
                    value={formData.division}
                    onChange={(e) => updateField("division", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    District / County
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. District or County"
                    value={formData.district}
                    onChange={(e) => updateField("district", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Area / Neighborhood
              </label>
              <input
                type="text"
                placeholder="e.g. Chashara / Agrabad C/A"
                value={formData.area}
                onChange={(e) => updateField("area", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Street / Road
              </label>
              <input
                type="text"
                placeholder="e.g. Station Road, Plot 14"
                value={formData.streetRoad}
                onChange={(e) => updateField("streetRoad", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Building Name
              </label>
              <input
                type="text"
                placeholder="e.g. Al-Baraka Logistics Center"
                value={formData.buildingName}
                onChange={(e) => updateField("buildingName", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Floor Number / Section
              </label>
              <input
                type="text"
                placeholder="e.g. 1st & 2nd Floor, Shed 3"
                value={formData.floorNumber}
                onChange={(e) => updateField("floorNumber", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Full Physical Address
              </label>
              <textarea
                rows={2}
                placeholder="Complete address including postal code and loading gate directions..."
                value={formData.fullAddress}
                onChange={(e) => updateField("fullAddress", e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Google Maps Location URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={formData.googleMapsLocation}
                onChange={(e) => updateField("googleMapsLocation", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> Additional Information
          </CardTitle>
          <CardDescription className="text-xs">
            Facility remarks, storage specifications, and operational status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Operational purpose (e.g. Primary hub for imported cotton rolls and bulk delivery)..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Internal Notes
              </label>
              <textarea
                rows={2}
                placeholder="Security protocols, keyholder contacts, loading dock height, access hours..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Operational Status
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    checked={formData.status === "ACTIVE"}
                    onChange={() => updateField("status", "ACTIVE")}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-foreground">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="status"
                    value="INACTIVE"
                    checked={formData.status === "INACTIVE"}
                    onChange={() => updateField("status", "INACTIVE")}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-muted-foreground">Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/store-management/storage-locations">
          <Button variant="outline" type="button" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving} className="gap-2 shadow-sm min-w-[140px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? "Update Location" : "Save Storage Location"}
        </Button>
      </div>
    </form>
  );
}

