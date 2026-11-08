"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Coins,
  FileText,
  Save,
  Loader2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BANGLADESH_DIVISIONS,
  COMMON_COUNTRIES,
  SOURCE_TYPES,
  CURRENCIES,
} from "@/lib/geo-data";

export interface PurchaseSourceFormData {
  id?: string;
  sourceName: string;
  sourceCode?: string;
  sourceType: string;
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  whatsappNumber: string;
  emailAddress: string;
  website: string;
  country: string;
  division: string;
  city: string;
  district: string;
  upazila: string;
  marketName: string;
  areaStreet: string;
  buildingName: string;
  shopNumber: string;
  fullAddress: string;
  googleMapsLocation: string;
  preferredCurrency: string;
  paymentTerms: string;
  supplierNotes: string;
  additionalDescription: string;
  status: "ACTIVE" | "INACTIVE";
}

interface PurchaseSourceFormProps {
  initialData?: PurchaseSourceFormData | null;
  isEdit?: boolean;
}

export function PurchaseSourceForm({ initialData, isEdit = false }: PurchaseSourceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  const [formData, setFormData] = React.useState<PurchaseSourceFormData>({
    id: initialData?.id || "",
    sourceName: initialData?.sourceName || "",
    sourceCode: initialData?.sourceCode || "",
    sourceType: initialData?.sourceType || "Manufacturer / Factory",
    supplierName: initialData?.supplierName || "",
    contactPerson: initialData?.contactPerson || "",
    phoneNumber: initialData?.phoneNumber || "",
    whatsappNumber: initialData?.whatsappNumber || "",
    emailAddress: initialData?.emailAddress || "",
    website: initialData?.website || "",
    country: initialData?.country || "Bangladesh",
    division: initialData?.division || "Dhaka",
    city: initialData?.city || "",
    district: initialData?.district || "Dhaka",
    upazila: initialData?.upazila || "",
    marketName: initialData?.marketName || "",
    areaStreet: initialData?.areaStreet || "",
    buildingName: initialData?.buildingName || "",
    shopNumber: initialData?.shopNumber || "",
    fullAddress: initialData?.fullAddress || "",
    googleMapsLocation: initialData?.googleMapsLocation || "",
    preferredCurrency: initialData?.preferredCurrency || "BDT",
    paymentTerms: initialData?.paymentTerms || "",
    supplierNotes: initialData?.supplierNotes || "",
    additionalDescription: initialData?.additionalDescription || "",
    status: initialData?.status || "ACTIVE",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isBangladesh = formData.country.toLowerCase() === "bangladesh";

  // Available districts based on selected BD division
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

  const updateField = (field: keyof PurchaseSourceFormData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Reset district and upazila when division changes
      if (field === "division" && isBangladesh) {
        const divObj = BANGLADESH_DIVISIONS.find(
          (d) => d.name.toLowerCase() === String(value).toLowerCase()
        );
        const firstDist = divObj?.districts[0]?.name || "";
        next.district = firstDist;
        next.upazila = divObj?.districts[0]?.upazilas?.[0] || "";
      }
      // Reset upazila when district changes
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
    if (!formData.sourceName.trim()) {
      newErrors.sourceName = "Source name is required";
    }
    if (!formData.sourceType) {
      newErrors.sourceType = "Source type is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    if (formData.emailAddress && !/^\S+@\S+\.\S+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = "Please enter a valid email address";
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
        ? `/api/store-management/purchase-sources/${initialData?.id}`
        : "/api/store-management/purchase-sources";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save purchase source");
      }

      toast.success(
        isEdit
          ? `Source "${formData.sourceName}" updated!`
          : `Source "${formData.sourceName}" registered successfully!`,
        { icon: "📍" }
      );

      router.push("/store-management/purchase-sources");
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
            href="/store-management/purchase-sources"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEdit ? "Edit Purchase Source" : "Add Purchase Source"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record where raw fabrics, materials, and goods are sourced or purchased
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store-management/purchase-sources">
            <Button variant="outline" type="button" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2 shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Source" : "Save Purchase Source"}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Basic Information
          </CardTitle>
          <CardDescription className="text-xs">
            Core identification and contact details for this purchasing partner or mill
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Source Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Clothing Factory, Guangzhou or Islampur Stall #42"
                value={formData.sourceName}
                onChange={(e) => updateField("sourceName", e.target.value)}
                className={`w-full h-9 rounded-lg border px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.sourceName ? "border-destructive" : "border-input"
                }`}
              />
              {errors.sourceName && (
                <p className="text-[11px] text-destructive mt-1">{errors.sourceName}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Source Code
              </label>
              <input
                type="text"
                disabled
                value={formData.sourceCode || "(Auto-generated e.g. SRC-000001)"}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-muted/60 text-muted-foreground font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Automatically numbered upon creation
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Source Type <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.sourceType}
                onChange={(e) => updateField("sourceType", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Supplier / Company / Factory Name
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Garments Ltd."
                value={formData.supplierName}
                onChange={(e) => updateField("supplierName", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Mr. Chen Wei / Haji Nurul Islam"
                value={formData.contactPerson}
                onChange={(e) => updateField("contactPerson", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +880 1712 345678 or +86 20 8123 4567"
                value={formData.phoneNumber}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="e.g. +86 138 0000 1111"
                value={formData.whatsappNumber}
                onChange={(e) => updateField("whatsappNumber", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. sales@abc-textile.com"
                value={formData.emailAddress}
                onChange={(e) => updateField("emailAddress", e.target.value)}
                className={`w-full h-9 rounded-lg border px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.emailAddress ? "border-destructive" : "border-input"
                }`}
              />
              {errors.emailAddress && (
                <p className="text-[11px] text-destructive mt-1">{errors.emailAddress}</p>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Website (optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Location Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Location Information
            </span>
            <span className="text-[11px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {isBangladesh ? "🇧🇩 Bangladesh Administrative Hierarchy" : "🌍 International Location Mode"}
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Dynamic address fields tailored to domestic or overseas supplier origins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Country Selector */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Country <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                {COMMON_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* If Bangladesh: Use Bangladesh Hierarchy */}
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
                    Upazila / Thana (উপজেলা / থানা)
                  </label>
                  {availableUpazilas.length > 0 ? (
                    <select
                      value={formData.upazila}
                      onChange={(e) => updateField("upazila", e.target.value)}
                      className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select Upazila / Area</option>
                      {availableUpazilas.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Kotwali / Sadar"
                      value={formData.upazila}
                      onChange={(e) => updateField("upazila", e.target.value)}
                      className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Market / Plaza / Mall Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ahsanullah Cloth Market, Islampur"
                    value={formData.marketName}
                    onChange={(e) => updateField("marketName", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </>
            ) : (
              /* Foreign Country Location Fields */
              <>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    State / Province / Region
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guangdong (China) / Gujarat (India)"
                    value={formData.division}
                    onChange={(e) => updateField("division", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    City / Municipality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guangzhou, Surat, Istanbul, Ho Chi Minh"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    District / Industrial Zone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Panyu Industrial Park / Ring Road Textile Market"
                    value={formData.district}
                    onChange={(e) => updateField("district", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Market / Commercial Center
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zhongda Fabric Market"
                    value={formData.marketName}
                    onChange={(e) => updateField("marketName", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Area / Street / Road
              </label>
              <input
                type="text"
                placeholder="e.g. Islampur Road, Road 4, Sector 2"
                value={formData.areaStreet}
                onChange={(e) => updateField("areaStreet", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Building Name / Number
              </label>
              <input
                type="text"
                placeholder="e.g. Building 4 / Haider Mansion"
                value={formData.buildingName}
                onChange={(e) => updateField("buildingName", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Shop Number / Stall Number
              </label>
              <input
                type="text"
                placeholder="e.g. Stall #42-43 / Unit 102"
                value={formData.shopNumber}
                onChange={(e) => updateField("shopNumber", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Full Physical Address
              </label>
              <textarea
                rows={2}
                placeholder="Complete address including postal code, floor, and nearest landmark..."
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

      {/* Business & Commercial Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" /> Business & Commercial Information
          </CardTitle>
          <CardDescription className="text-xs">
            Currency, settlement conditions, and supplier commercial terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Preferred Currency
              </label>
              <select
                value={formData.preferredCurrency}
                onChange={(e) => updateField("preferredCurrency", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.name} ({cur.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Payment Terms
              </label>
              <input
                type="text"
                placeholder="e.g. 30% Advance, 70% LC upon Bill of Lading, or 15-day Credit"
                value={formData.paymentTerms}
                onChange={(e) => updateField("paymentTerms", e.target.value)}
                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Supplier Notes & Product Specialties
              </label>
              <textarea
                rows={2}
                placeholder="Notes on fabric qualities, minimum order quantities (MOQ), lead times, weaving specialties..."
                value={formData.supplierNotes}
                onChange={(e) => updateField("supplierNotes", e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-foreground mb-1 block">
                Additional Description
              </label>
              <textarea
                rows={2}
                placeholder="Any internal remarks, travel directions, or partnership background..."
                value={formData.additionalDescription}
                onChange={(e) => updateField("additionalDescription", e.target.value)}
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
        <Link href="/store-management/purchase-sources">
          <Button variant="outline" type="button" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving} className="gap-2 shadow-sm min-w-[140px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? "Update Source" : "Save Purchase Source"}
        </Button>
      </div>
    </form>
  );
}

