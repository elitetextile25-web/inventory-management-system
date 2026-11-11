"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Package,
  Layers,
  Save,
  Tag,
  Palette,
  DollarSign,
  Warehouse,
  Percent,
  Plus,
  Trash2,
  Copy,
  Check,
  Scale,
  Ruler,
  AlertCircle,
  Truck,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface Option {
  id: string;
  name: string;
  abbreviation?: string;
  code?: string | null;
  hexCode?: string | null;
  type?: string | null;
  company?: string | null;
  children?: { id: string; name: string }[];
}

interface ProductFormProps {
  initialData?: any;
  categories: Option[];
  countries?: Option[];
  brands: Option[];
  units: Option[];
  storageLocations?: Option[];
  suppliers?: Option[];
  availableColors?: Option[];
  isEdit?: boolean;
}

const PRODUCT_TYPES = [
  { value: "FINISHED_PRODUCT", label: "Finished Product (e.g. T-Shirt, Polo, Panjabi)" },
  { value: "FABRIC", label: "Fabric (e.g. Cotton, Silk, Denim, Linen)" },
  { value: "ORDER", label: "Order (Customer / Bulk Custom Order)" },
  { value: "KNITTING", label: "Knitting (Knit fabric, yarn roll)" },
  { value: "RAW_MATERIAL", label: "Raw Material (Unprocessed yarn, dyes)" },
  { value: "ACCESSORIES", label: "Accessories (Buttons, Zippers, Labels)" },
  { value: "CUSTOM", label: "Custom (Specialty textile / items)" },
];

export function ProductForm({
  initialData,
  categories,
  countries = [],
  brands,
  units,
  storageLocations = [],
  suppliers = [],
  availableColors = [],
  isEdit = false,
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Auto Product Code State
  const [productCode, setProductCode] = React.useState<string>(
    initialData?.productCode || initialData?.sku || ""
  );
  const [fetchingCode, setFetchingCode] = React.useState(false);

  // Product Form State
  const [form, setForm] = React.useState({
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    productType: initialData?.productType ?? "FINISHED_PRODUCT",
    description: initialData?.description ?? "",
    categoryId: initialData?.categoryId ?? categories[0]?.id ?? "",
    subcategoryId: initialData?.subcategoryId ?? "",
    brandId: initialData?.brandId ?? "",
    unitId: initialData?.unitId ?? units[0]?.id ?? "",
    storageLocationId: initialData?.storageLocationId ?? "",
    shopId: initialData?.shopId ?? "",

    // Colors
    color: initialData?.color ?? "",
    colorIds: (initialData?.colors?.map((c: any) => String(c.colorId)) || []) as string[],

    // Measurements
    weight: initialData?.weight ? Number(initialData.weight) : "",
    weightUnit: initialData?.weightUnit ?? "KG",
    lengthInMeters: initialData?.lengthInMeters ? Number(initialData.lengthInMeters) : "",

    // Pricing & Discounts
    purchaseCost: initialData?.purchaseCost ? Number(initialData.purchaseCost) : 0,
    sellingPrice: initialData?.sellingPrice ? Number(initialData.sellingPrice) : 0,
    discountType: initialData?.discountType ?? "NONE",
    discountValue: initialData?.discountValue ? Number(initialData.discountValue) : 0,

    // Inventory
    initialStock: 0,
    minimumStock: initialData?.minimumStock ? Number(initialData.minimumStock) : 10,
    maximumStock: initialData?.maximumStock ? Number(initialData.maximumStock) : "",
    reorderLevel: initialData?.reorderLevel ? Number(initialData.reorderLevel) : 20,
    rackNumber: initialData?.rackNumber ?? "",
    shelfNumber: initialData?.shelfNumber ?? "",

    // Barcode & Tax
    barcode: initialData?.barcodes?.[0]?.barcode ?? "",
    taxRate: initialData?.taxRate ? Number(initialData.taxRate) : 0,
    isTaxable: initialData?.isTaxable ?? false,

    // Supplier
    supplierId: initialData?.supplierProducts?.[0]?.supplierId ?? "",
    purchaseReference: initialData?.supplierProducts?.[0]?.purchaseReference ?? "",

    status: initialData?.status ?? "ACTIVE",
  });

  // Multiple Images State
  const [imageUrls, setImageUrls] = React.useState<string[]>(() => {
    if (initialData?.images && initialData.images.length > 0) {
      return initialData.images.map((img: any) => img.url);
    }
    if (initialData?.imageUrl) {
      return [initialData.imageUrl];
    }
    return [];
  });
  const [newImageUrl, setNewImageUrl] = React.useState("");

  // Color Swatches State
  const [colorList, setColorList] = React.useState<Option[]>(availableColors);
  const [customColorName, setCustomColorName] = React.useState("");
  const [customColorHex, setCustomColorHex] = React.useState("#1e40af");
  const [creatingColor, setCreatingColor] = React.useState(false);

  // Field validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Subcategories derived from chosen Category
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const availableSubcategories = selectedCategory?.children || [];

  // Fetch or Preview Auto-Generated Unique Product Code
  const fetchProductCode = React.useCallback(
    async (type: string, catId: string) => {
      if (isEdit && productCode) return; // Never overwrite on edit
      setFetchingCode(true);
      try {
        const res = await fetch(`/api/products/code?type=${type}&categoryId=${catId}`);
        const data = await res.json();
        if (data.code) {
          setProductCode(data.code);
          if (!form.sku || form.sku.startsWith(data.prefix)) {
            setForm((prev) => ({ ...prev, sku: data.code }));
          }
        }
      } catch {
        console.warn("Failed to generate product code preview");
      } finally {
        setFetchingCode(false);
      }
    },
    [isEdit, productCode, form.sku]
  );

  // Initial code fetch on mount for new product
  React.useEffect(() => {
    if (!isEdit && !productCode) {
      fetchProductCode(form.productType, form.categoryId);
    }
  }, [isEdit, productCode, form.productType, form.categoryId, fetchProductCode]);

  // When Category or Product Type changes, update Product Code if new
  const handleCategoryChange = (catId: string) => {
    setForm((f) => ({ ...f, categoryId: catId, subcategoryId: "" }));
    if (!isEdit) {
      fetchProductCode(form.productType, catId);
    }
    if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: "" }));
  };

  const handleProductTypeChange = (pType: string) => {
    setForm((f) => ({ ...f, productType: pType }));
    if (!isEdit) {
      fetchProductCode(pType, form.categoryId);
    }
  };

  // Pricing & Profit Calculation Logic
  const cost = Number(form.purchaseCost) || 0;
  const regularPrice = Number(form.sellingPrice) || 0;
  const discountVal = Number(form.discountValue) || 0;

  const finalPrice = React.useMemo(() => {
    if (form.discountType === "PERCENTAGE") {
      const disc = (regularPrice * Math.min(100, discountVal)) / 100;
      return Math.max(0, regularPrice - disc);
    }
    if (form.discountType === "FIXED") {
      return Math.max(0, regularPrice - discountVal);
    }
    return regularPrice;
  }, [regularPrice, form.discountType, discountVal]);

  const profitPerUnit = finalPrice - cost;
  const profitMarginPercent =
    finalPrice > 0 ? ((profitPerUnit / finalPrice) * 100).toFixed(1) : "0.0";

  // Image helpers
  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (imageUrls.includes(trimmed)) {
      toast.error("Image already added");
      return;
    }
    setImageUrls((prev) => [...prev, trimmed]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setImageUrls((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  // Color selection helpers
  const toggleColor = (colorId: string) => {
    setForm((prev) => {
      const exists = prev.colorIds.includes(colorId);
      const updated = exists
        ? prev.colorIds.filter((id: string) => id !== colorId)
        : [...prev.colorIds, colorId];
      return { ...prev, colorIds: updated };
    });
  };

  const handleCreateCustomColor = async () => {
    if (!customColorName.trim()) {
      toast.error("Color name is required");
      return;
    }
    setCreatingColor(true);
    try {
      const res = await fetch("/api/configuration/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customColorName.trim(), hexCode: customColorHex }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create color");
      }
      setColorList((prev) => [...prev, data.data]);
      setForm((prev) => ({
        ...prev,
        colorIds: [...prev.colorIds, data.data.id],
        color: customColorName.trim(),
      }));
      setCustomColorName("");
      toast.success(`Color "${data.data.name}" added!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add color");
    } finally {
      setCreatingColor(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!productCode) return;
    navigator.clipboard.writeText(productCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success("Product code copied!");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.categoryId) newErrors.categoryId = "Product category is required";
    if (form.purchaseCost < 0) newErrors.purchaseCost = "Buying price cannot be negative";
    if (form.sellingPrice < 0) newErrors.sellingPrice = "Selling price cannot be negative";
    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 100) {
      newErrors.discountValue = "Discount cannot exceed 100%";
    }
    if (form.discountType === "FIXED" && Number(form.discountValue) > Number(form.sellingPrice)) {
      newErrors.discountValue = "Discount cannot exceed regular selling price";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields properly.");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/products/${initialData.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || productCode,
        productType: form.productType,
        description: form.description.trim() || null,
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || null,
        brandId: form.brandId || null,
        unitId: form.unitId || null,
        storageLocationId: form.storageLocationId || null,
        shopId: form.shopId || null,

        // Color
        color: form.color || null,
        colorIds: form.colorIds,

        // Measurements
        weight: form.weight !== "" ? Number(form.weight) : null,
        weightUnit: form.weightUnit,
        lengthInMeters: form.lengthInMeters !== "" ? Number(form.lengthInMeters) : null,

        // Pricing & Discounts
        purchaseCost: Number(form.purchaseCost),
        sellingPrice: Number(form.sellingPrice),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),

        // Inventory
        initialStock: !isEdit ? Number(form.initialStock) : 0,
        minimumStock: Number(form.minimumStock),
        maximumStock: form.maximumStock !== "" ? Number(form.maximumStock) : null,
        reorderLevel: Number(form.reorderLevel),
        rackNumber: form.rackNumber.trim() || null,
        shelfNumber: form.shelfNumber.trim() || null,

        // Media
        imageUrl: imageUrls[0] || null,
        imageUrls,

        // Barcode & Tax
        barcode: form.barcode.trim() || null,
        taxRate: Number(form.taxRate),
        isTaxable: form.isTaxable,

        // Supplier
        supplierId: form.supplierId || null,
        purchaseReference: form.purchaseReference.trim() || null,

        status: form.status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      toast.success(
        isEdit
          ? `Product "${form.name}" updated successfully!`
          : `Product created with Code ${data.product?.productCode || productCode}!`
      );
      router.push("/products");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/products" title="Back to products">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground">
                {isEdit ? `Edit Product: ${form.name || "Product"}` : "Add New Product"}
              </h1>
              {productCode && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold">
                  {fetchingCode ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>{productCode}</span>
                  )}
                  <button
                    type="button"
                    onClick={copyCodeToClipboard}
                    className="hover:text-primary-foreground transition-colors"
                    title="Copy product code"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? "Update pricing, specifications, images, and supplier records"
                : "Create a scalable clothing, T-shirt, or textile product record with an automatic code"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button onClick={() => handleSubmit()} disabled={loading} className="gap-2 shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A: Basic Product Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Basic Product Information
            </CardTitle>
            <CardDescription>
              Essential product classification, unique identifier, name, and category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Product Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Product Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% Combed Cotton Crew Neck T-Shirt (GSM 180)"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  className={`w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.name ? "border-danger ring-danger/20" : "border-input"
                  }`}
                />
                {errors.name && <p className="text-[11px] text-danger">{errors.name}</p>}
              </div>

              {/* Automatic Unique Product Code (Read-Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Product Code (Auto)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Read-only</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productCode || "Generating..."}
                    readOnly
                    className="w-full h-9 rounded-lg border border-border bg-muted/60 px-3 text-sm font-mono font-bold text-primary focus:outline-none cursor-not-allowed"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => fetchProductCode(form.productType, form.categoryId)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        title="Regenerate preview"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${fetchingCode ? "animate-spin" : ""}`} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Permanent code automatically generated based on product classification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Product Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Product Category <span className="text-danger">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.categoryId ? "border-danger" : "border-input"
                  }`}
                >
                  <option value="">— Select Category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-[11px] text-danger">{errors.categoryId}</p>}
              </div>

              {/* Product Subcategory */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Subcategory <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <select
                  value={form.subcategoryId}
                  onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
                  disabled={availableSubcategories.length === 0}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">— None / Select Subcategory —</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Type Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Product Type <span className="text-danger">*</span>
                </label>
                <select
                  value={form.productType}
                  onChange={(e) => handleProductTypeChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PRODUCT_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Brand / Mill */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Brand / Textile Mill</label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Brand / Mill (Optional) —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU / Secondary Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>SKU / Custom Tag</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="Defaults to product code if empty"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Barcode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Barcode / EAN-13</label>
                <input
                  type="text"
                  placeholder="e.g. 8901030382910"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Product Description</label>
              <textarea
                rows={2}
                placeholder="Product specifications, fabric blend (e.g. 95% cotton 5% spandex), weave type, wash care..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section B: Multiple Product Images */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" /> Product Images (Multiple Supported)
            </CardTitle>
            <CardDescription>
              Add one or more image links to showcase fabric textures, colorways, or model shots.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste image URL (https://... or /uploads/...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
                className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="button" size="sm" onClick={handleAddImage} className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Image
              </Button>
            </div>

            {imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-lg border border-border bg-muted/20 overflow-hidden flex flex-col items-center justify-between p-2"
                  >
                    <div className="w-full h-24 rounded bg-background flex items-center justify-center overflow-hidden mb-2">
                      <img
                        src={url}
                        alt={`Product image ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/200x200?text=Invalid+Image";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between w-full">
                      {idx === 0 ? (
                        <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="text-muted-foreground hover:text-danger p-1"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No images added yet. Add image URLs above to display in product catalogs and invoices.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Section C: Color Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Color Management (Optional)
            </CardTitle>
            <CardDescription>
              Select product color options or register custom fabric/garment color shades with swatches.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Select Available Colors for this Product:
              </label>
              <div className="flex flex-wrap gap-2">
                {colorList.map((c) => {
                  const isSelected = form.colorIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                          : "border-border bg-card text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: c.hexCode || "#999999" }}
                      />
                      <span>{c.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Creator */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-muted-foreground font-medium">Add New Color Shade:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Color name (e.g., Dusty Rose, Melange Grey)"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring w-48"
                />
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent"
                  title="Pick color shade"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={creatingColor}
                  onClick={handleCreateCustomColor}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Color
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section D: Measurement and Weight */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" /> Measurement and Weight
            </CardTitle>
            <CardDescription>
              Flexible units for apparel, yarn, and fabrics. Weight and meter lengths are optional based on product type.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Measurement Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Measurement Unit <span className="text-danger">*</span>
              </label>
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            {/* Weight (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Weight <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 0.25"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={form.weightUnit}
                  onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}
                  className="w-20 h-9 rounded-lg border border-input bg-background px-2 text-xs font-medium focus:outline-none"
                >
                  <option value="KG">KG</option>
                  <option value="GM">GM</option>
                </select>
              </div>
            </div>

            {/* Length in Meter (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Length in Meter <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 50 (for fabric rolls)"
                value={form.lengthInMeters}
                onChange={(e) => setForm({ ...form, lengthInMeters: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Initial Stock (Only for New Products) */}
            {!isEdit ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Opening Stock <span className="text-muted-foreground font-normal">(Initial)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.initialStock}
                  onChange={(e) => setForm({ ...form, initialStock: Number(e.target.value) })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Stock Ledger</label>
                <div className="h-9 flex items-center px-3 rounded-lg bg-muted text-xs text-muted-foreground">
                  Use Stock Adjustments to modify inventory.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section E: Dedicated Pricing & Profit Calculator */}
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Pricing &amp; Automatic Profit Calculations
            </CardTitle>
            <CardDescription>
              All currency calculations in Bangladeshi Taka (৳ BDT). Final selling price and unit margins are calculated live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Buying Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Buying Price / Cost (৳) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.purchaseCost}
                    onChange={(e) => setForm({ ...form, purchaseCost: Number(e.target.value) })}
                    className={`w-full h-9 rounded-lg border bg-background pl-7 pr-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.purchaseCost ? "border-danger" : "border-input"
                    }`}
                  />
                </div>
              </div>

              {/* Regular Selling Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Regular Selling Price (৳) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                    className={`w-full h-9 rounded-lg border bg-background pl-7 pr-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.sellingPrice ? "border-danger" : "border-input"
                    }`}
                  />
                </div>
              </div>

              {/* Discount Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="NONE">No Discount</option>
                  <option value="FIXED">Fixed Amount (৳)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Discount Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                    {form.discountType === "PERCENTAGE" ? "%" : "৳"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={form.discountType === "NONE"}
                    placeholder="0.00"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className={`w-full h-9 rounded-lg border bg-background pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                      errors.discountValue ? "border-danger" : "border-input"
                    }`}
                  />
                </div>
                {errors.discountValue && <p className="text-[11px] text-danger">{errors.discountValue}</p>}
              </div>
            </div>

            {/* Live Financial Calculation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Final Selling Price
                </p>
                <p className="text-2xl font-bold font-mono text-primary mt-1">
                  {formatCurrency(finalPrice)}
                </p>
                {form.discountType !== "NONE" && discountVal > 0 && (
                  <p className="text-[11px] text-muted-foreground line-through mt-0.5">
                    Regular: {formatCurrency(regularPrice)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Estimated Profit Per Unit
                </p>
                <p
                  className={`text-2xl font-bold font-mono mt-1 ${
                    profitPerUnit >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {profitPerUnit >= 0 ? "+" : ""}
                  {formatCurrency(profitPerUnit)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Buying cost: {formatCurrency(cost)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Profit Margin
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-2xl font-bold font-mono ${
                      Number(profitMarginPercent) >= 15
                        ? "text-success"
                        : Number(profitMarginPercent) >= 0
                        ? "text-warning"
                        : "text-danger"
                    }`}
                  >
                    {profitMarginPercent}%
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      Number(profitMarginPercent) >= 15
                        ? "bg-success/15 text-success"
                        : Number(profitMarginPercent) >= 0
                        ? "bg-warning/15 text-warning"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {Number(profitMarginPercent) >= 15
                      ? "Healthy"
                      : Number(profitMarginPercent) >= 0
                      ? "Low"
                      : "Loss"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section F: Inventory & Warehouse Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-primary" /> Inventory, Storage Location &amp; Thresholds
            </CardTitle>
            <CardDescription>
              Assign physical storage warehouse, shelf location, and low stock alert triggers.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Storage Location */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground">
                Assigned Warehouse / Storage Location
              </label>
              <select
                value={form.storageLocationId}
                onChange={(e) => setForm({ ...form, storageLocationId: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select Warehouse / Showroom Location (Optional) —</option>
                {storageLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code} · {loc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Stock Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Minimum Stock Alert <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="10"
                value={form.minimumStock}
                onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Maximum Stock Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Maximum Stock Capacity</label>
              <input
                type="number"
                min="0"
                placeholder="Optional"
                value={form.maximumStock}
                onChange={(e) => setForm({ ...form, maximumStock: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Rack Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Rack Number</label>
              <input
                type="text"
                placeholder="e.g. Rack-B3"
                value={form.rackNumber}
                onChange={(e) => setForm({ ...form, rackNumber: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Shelf Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Shelf / Bin Number</label>
              <input
                type="text"
                placeholder="e.g. Shelf-02"
                value={form.shelfNumber}
                onChange={(e) => setForm({ ...form, shelfNumber: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Tax Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">VAT / Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                value={form.taxRate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    taxRate: Number(e.target.value),
                    isTaxable: Number(e.target.value) > 0,
                  })
                }
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Product Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ACTIVE">Active (In Catalog)</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Section G: Supplier Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Supplier &amp; Procurement Details
            </CardTitle>
            <CardDescription>
              Link this product to textile mills, wholesale market suppliers, or importing vendors.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Primary Supplier</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select Supplier (Optional) —</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} {sup.company ? `(${sup.company})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Purchase Order / Batch Reference
              </label>
              <input
                type="text"
                placeholder="e.g. PO-2026-CH-001 or Guangzhou Invoice #49"
                value={form.purchaseReference}
                onChange={(e) => setForm({ ...form, purchaseReference: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="gap-2 px-6 shadow-md">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
