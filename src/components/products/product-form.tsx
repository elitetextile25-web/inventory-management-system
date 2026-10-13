"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Package,
  DollarSign,
  Layers,
  Barcode,
  Save,
  MapPin,
  FolderTree,
  Store,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Option {
  id: string;
  name: string;
  abbreviation?: string;
  code?: string | null;
  children?: { id: string; name: string }[];
}

interface ProductFormProps {
  initialData?: any;
  categories: Option[];
  countries?: Option[];
  brands: Option[];
  units: Option[];
  isEdit?: boolean;
}

export function ProductForm({
  initialData,
  categories,
  countries = [],
  brands,
  units,
  isEdit,
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  // Initial location hierarchy if editing
  const initialShop = initialData?.shop;
  const initialArea = initialShop?.area;
  const initialDistrict = initialArea?.district;
  const initialDivision = initialDistrict?.division;
  const initialCountry = initialDivision?.country;

  // Location cascading state
  const [countryId, setCountryId] = React.useState<string>(initialCountry?.id || "");
  const [divisionId, setDivisionId] = React.useState<string>(initialDivision?.id || "");
  const [districtId, setDistrictId] = React.useState<string>(initialDistrict?.id || "");
  const [areaId, setAreaId] = React.useState<string>(initialArea?.id || "");
  const [shopId, setShopId] = React.useState<string>(initialData?.shopId || initialShop?.id || "");

  // Cascading options lists
  const [availableCountries, setAvailableCountries] = React.useState<Option[]>(countries);
  const [divisions, setDivisions] = React.useState<Option[]>([]);
  const [districts, setDistricts] = React.useState<Option[]>([]);
  const [areas, setAreas] = React.useState<Option[]>([]);
  const [shops, setShops] = React.useState<Option[]>([]);

  // Loading states for cascading fetches
  const [loadingDivisions, setLoadingDivisions] = React.useState(false);
  const [loadingDistricts, setLoadingDistricts] = React.useState(false);
  const [loadingAreas, setLoadingAreas] = React.useState(false);
  const [loadingShops, setLoadingShops] = React.useState(false);

  // Field validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Product core form state
  const [form, setForm] = React.useState({
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    description: initialData?.description ?? "",
    categoryId: initialData?.categoryId ?? "",
    subcategoryId: initialData?.subcategoryId ?? "",
    brandId: initialData?.brandId ?? "",
    unitId: initialData?.unitId ?? "",
    purchaseCost: initialData?.purchaseCost ? Number(initialData.purchaseCost) : 0,
    sellingPrice: initialData?.sellingPrice ? Number(initialData.sellingPrice) : 0,
    minimumStock: initialData?.minimumStock ? Number(initialData.minimumStock) : 10,
    reorderLevel: initialData?.reorderLevel ? Number(initialData.reorderLevel) : 20,
    taxRate: initialData?.taxRate ? Number(initialData.taxRate) : 0,
    barcode: initialData?.barcodes?.[0]?.barcode ?? "",
    initialStock: 0,
    status: initialData?.status ?? "ACTIVE",
  });

  // Ensure country list is populated if not passed via props
  React.useEffect(() => {
    if (availableCountries.length === 0) {
      fetch("/api/configuration/geo/countries")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setAvailableCountries(data.data);
        })
        .catch(() => {});
    }
  }, [availableCountries.length]);

  // Initial load of dependent location data if editing
  React.useEffect(() => {
    if (initialCountry?.id) {
      fetch(`/api/configuration/geo/divisions?countryId=${initialCountry.id}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.data) setDivisions(d.data);
        });
    }
    if (initialDivision?.id) {
      fetch(`/api/configuration/geo/districts?divisionId=${initialDivision.id}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.data) setDistricts(d.data);
        });
    }
    if (initialDistrict?.id) {
      fetch(`/api/configuration/geo/areas?districtId=${initialDistrict.id}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.data) setAreas(d.data);
        });
    }
    if (initialArea?.id) {
      fetch(`/api/configuration/shops?areaId=${initialArea.id}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.data) setShops(d.data);
        });
    }
  }, [initialCountry?.id, initialDivision?.id, initialDistrict?.id, initialArea?.id]);

  // Handle Country Change
  const handleCountryChange = async (newCountryId: string) => {
    setCountryId(newCountryId);
    setDivisionId("");
    setDistrictId("");
    setAreaId("");
    setShopId("");
    setDivisions([]);
    setDistricts([]);
    setAreas([]);
    setShops([]);
    if (errors.country) setErrors((prev) => ({ ...prev, country: "" }));

    if (!newCountryId) return;

    setLoadingDivisions(true);
    try {
      const res = await fetch(`/api/configuration/geo/divisions?countryId=${newCountryId}`);
      const data = await res.json();
      if (data.data) setDivisions(data.data);
    } catch {
      toast.error("Failed to load divisions");
    } finally {
      setLoadingDivisions(false);
    }
  };

  // Handle Division Change
  const handleDivisionChange = async (newDivisionId: string) => {
    setDivisionId(newDivisionId);
    setDistrictId("");
    setAreaId("");
    setShopId("");
    setDistricts([]);
    setAreas([]);
    setShops([]);
    if (errors.division) setErrors((prev) => ({ ...prev, division: "" }));

    if (!newDivisionId) return;

    setLoadingDistricts(true);
    try {
      const res = await fetch(`/api/configuration/geo/districts?divisionId=${newDivisionId}`);
      const data = await res.json();
      if (data.data) setDistricts(data.data);
    } catch {
      toast.error("Failed to load districts");
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Handle District Change
  const handleDistrictChange = async (newDistrictId: string) => {
    setDistrictId(newDistrictId);
    setAreaId("");
    setShopId("");
    setAreas([]);
    setShops([]);
    if (errors.district) setErrors((prev) => ({ ...prev, district: "" }));

    if (!newDistrictId) return;

    setLoadingAreas(true);
    try {
      const res = await fetch(`/api/configuration/geo/areas?districtId=${newDistrictId}`);
      const data = await res.json();
      if (data.data) setAreas(data.data);
    } catch {
      toast.error("Failed to load areas");
    } finally {
      setLoadingAreas(false);
    }
  };

  // Handle Area Change
  const handleAreaChange = async (newAreaId: string) => {
    setAreaId(newAreaId);
    setShopId("");
    setShops([]);
    if (errors.area) setErrors((prev) => ({ ...prev, area: "" }));

    if (!newAreaId) return;

    setLoadingShops(true);
    try {
      const res = await fetch(`/api/configuration/shops?areaId=${newAreaId}`);
      const data = await res.json();
      if (data.data) setShops(data.data);
    } catch {
      toast.error("Failed to load shops");
    } finally {
      setLoadingShops(false);
    }
  };

  // Handle Category Change -> resets subcategory
  const handleCategoryChange = (newCatId: string) => {
    setForm((f) => ({
      ...f,
      categoryId: newCatId,
      subcategoryId: "", // Clear subcategory when parent changes
    }));
    if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
  };

  // Find subcategories for chosen category
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const availableSubcategories = selectedCategory?.children || [];

  // Calculate live margin
  const cost = Number(form.purchaseCost) || 0;
  const price = Number(form.sellingPrice) || 0;
  const marginPercent = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
  const profitAmount = (price - cost).toFixed(2);

  const generateSku = () => {
    const prefix = form.name
      ? form.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "PRD")
      : "PRD";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setForm((f) => ({ ...f, sku: `${prefix}-${randomNum}` }));
    if (errors.sku) setErrors((prev) => ({ ...prev, sku: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.sku.trim()) newErrors.sku = "SKU code is required";
    if (form.purchaseCost < 0) newErrors.purchaseCost = "Purchase cost cannot be negative";
    if (form.sellingPrice < 0) newErrors.sellingPrice = "Selling price cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/products/${initialData.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        ...form,
        shopId: shopId || null,
        subcategoryId: form.subcategoryId || null,
        categoryId: form.categoryId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save product");
        setLoading(false);
        return;
      }

      toast.success(isEdit ? "Product updated successfully!" : "Product created successfully!");
      router.push("/products");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products" title="Back to products">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? `Edit: ${form.name || "Product"}` : "New Product"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? "Update product location, classification, pricing, and stock"
                : "Add a new fabric or product item with location and classification"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================== */}
        {/* SECTION A: LOCATION SELECTION (Must Appear First)             */}
        {/* ============================================================== */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="bg-primary/5 rounded-t-xl pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Section A
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <CardTitle className="text-base">Location & Store Selection</CardTitle>
                </div>
                <CardDescription>
                  Geographic location hierarchy and assigned shop branch (Country → Division → District → Area → Shop)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {/* Cascading chain breadcrumb indicator */}
            {(countryId || divisionId || districtId || areaId || shopId) && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Selected Chain:</span>
                {countryId && (
                  <span className="text-primary font-medium">
                    {availableCountries.find((c) => c.id === countryId)?.name || "Country"}
                  </span>
                )}
                {divisionId && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-primary font-medium">
                      {divisions.find((d) => d.id === divisionId)?.name || "Division"}
                    </span>
                  </>
                )}
                {districtId && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-primary font-medium">
                      {districts.find((d) => d.id === districtId)?.name || "District"}
                    </span>
                  </>
                )}
                {areaId && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-primary font-medium">
                      {areas.find((a) => a.id === areaId)?.name || "Area"}
                    </span>
                  </>
                )}
                {shopId && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Store className="w-3 h-3" />
                      {shops.find((s) => s.id === shopId)?.name || "Shop"}
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* 1. Country */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  1. Country
                </label>
                <select
                  value={countryId}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Country —</option>
                  {availableCountries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ""}
                    </option>
                  ))}
                </select>
                {availableCountries.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No countries configured. Visit Categories & Locations to add.
                  </p>
                )}
              </div>

              {/* 2. Division / State / Region */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center justify-between">
                  <span>2. Division / State / Region</span>
                  {loadingDivisions && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </label>
                <select
                  value={divisionId}
                  disabled={!countryId || loadingDivisions}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!countryId
                      ? "— Select Country first —"
                      : divisions.length === 0 && !loadingDivisions
                      ? "— No divisions found —"
                      : "— Select Division —"}
                  </option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Subdivision (Optional / Informative) */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center gap-1">
                  <span>3. Subdivision</span>
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="Standard hierarchy active"
                  className="flex h-10 w-full rounded-lg border border-input bg-muted/40 px-3 text-xs text-muted-foreground cursor-not-allowed"
                  title="Direct 5-level hierarchy is mapped: Country → Division → District → Area → Shop"
                />
              </div>

              {/* 4. District / County */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center justify-between">
                  <span>4. District / County</span>
                  {loadingDistricts && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </label>
                <select
                  value={districtId}
                  disabled={!divisionId || loadingDistricts}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!divisionId
                      ? "— Select Division first —"
                      : districts.length === 0 && !loadingDistricts
                      ? "— No districts found —"
                      : "— Select District —"}
                  </option>
                  {districts.map((dst) => (
                    <option key={dst.id} value={dst.id}>
                      {dst.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Area */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center justify-between">
                  <span>5. Area</span>
                  {loadingAreas && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </label>
                <select
                  value={areaId}
                  disabled={!districtId || loadingAreas}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!districtId
                      ? "— Select District first —"
                      : areas.length === 0 && !loadingAreas
                      ? "— No areas found —"
                      : "— Select Area —"}
                  </option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Shop / Store */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Store className="w-3.5 h-3.5" /> 6. Shop / Branch
                  </span>
                  {loadingShops && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </label>
                <select
                  value={shopId}
                  disabled={!areaId || loadingShops}
                  onChange={(e) => setShopId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-primary/40 bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!areaId
                      ? "— Select Area first —"
                      : shops.length === 0 && !loadingShops
                      ? "— No shops in this area —"
                      : "— Select Shop / Store —"}
                  </option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </option>
                  ))}
                </select>
                {areaId && shops.length === 0 && !loadingShops && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> No shops created for this area yet.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* SECTION B: PRODUCT CLASSIFICATION (Must Appear After Section A) */}
        {/* ============================================================== */}
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/30 rounded-t-xl pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Section B
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <CardTitle className="text-base">Product Classification</CardTitle>
                </div>
                <CardDescription>
                  Assign category, filtered subcategory, brand/mill, and measurement unit
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* 1. Category */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Subcategory (Filtered by selected category) */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center justify-between">
                  <span>Subcategory</span>
                  {form.categoryId && (
                    <span className="text-xs text-muted-foreground">
                      ({availableSubcategories.length} available)
                    </span>
                  )}
                </label>
                <select
                  value={form.subcategoryId}
                  disabled={!form.categoryId || availableSubcategories.length === 0}
                  onChange={(e) => setForm((f) => ({ ...f, subcategoryId: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!form.categoryId
                      ? "— Select Category first —"
                      : availableSubcategories.length === 0
                      ? "No subcategories available (optional)"
                      : "— Select Subcategory (Optional) —"}
                  </option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {form.categoryId && availableSubcategories.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No subcategories under {selectedCategory?.name}. Proceeding without subcategory.
                  </p>
                )}
              </div>

              {/* 3. Brand / Manufacturer */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Brand / Mill
                </label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Brand / Mill —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Unit of Measure */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Unit of Measure
                </label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Unit —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.abbreviation ? `(${u.abbreviation})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* SECTION C: BASIC INFORMATION & SPECIFICATIONS                 */}
        {/* ============================================================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Product title, identity, SKU, and specifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g. Premium Cotton Fabric 60 inch"
                  className={`flex h-10 w-full rounded-lg border ${
                    errors.name ? "border-destructive ring-1 ring-destructive" : "border-input"
                  } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors`}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    SKU Code <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.sku}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, sku: e.target.value }));
                    if (errors.sku) setErrors((prev) => ({ ...prev, sku: "" }));
                  }}
                  placeholder="e.g. FAB-1024"
                  className={`flex h-10 w-full font-mono rounded-lg border ${
                    errors.sku ? "border-destructive ring-1 ring-destructive" : "border-input"
                  } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors`}
                />
                {errors.sku && <p className="text-xs text-destructive mt-1">{errors.sku}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Fabric weave, GSM, colorway, width, or specific handling notes..."
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* SECTION D: PRICING & MARGINS                                  */}
        {/* ============================================================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Pricing & Margins</CardTitle>
                <CardDescription>Costs, retail selling prices, and live profit margins</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Purchase Cost (৳) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.purchaseCost}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseCost: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Selling Price (৳) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.sellingPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.taxRate}
                  onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Profit margin live badge preview */}
            <div className="p-3.5 rounded-lg bg-muted/60 border border-border flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Estimated Gross Profit:</span>
                <span className="font-semibold text-foreground">৳{profitAmount} / unit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Gross Margin:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    Number(marginPercent) >= 20
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : Number(marginPercent) > 0
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {marginPercent}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* SECTION E: INVENTORY & STOCK LEVELS                           */}
        {/* ============================================================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Inventory & Stock Levels</CardTitle>
                <CardDescription>Stock threshold alerts and optional opening quantity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Minimum Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minimumStock}
                  onChange={(e) => setForm((f) => ({ ...f, minimumStock: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Triggers low-stock warnings on dashboard</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={form.reorderLevel}
                  onChange={(e) => setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Suggested restock point</p>
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">
                    Opening Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.initialStock}
                    onChange={(e) => setForm((f) => ({ ...f, initialStock: Number(e.target.value) }))}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opening roll meters / units upon creation
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-muted-foreground" /> Barcode (EAN / UPC / Code128)
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Scan or enter barcode number"
                  className="flex h-10 w-full font-mono rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Publication Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ACTIVE">Active (Available for POS & Sales)</option>
                  <option value="DRAFT">Draft (Hidden from billing)</option>
                  <option value="ARCHIVED">Archived (Discontinued)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
