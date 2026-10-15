"use client";

import * as React from "react";
import {
  Globe,
  MapPin,
  FolderTree,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Building,
  Navigation,
  ArrowRight,
  Filter,
  RefreshCw,
  FolderPlus,
  Store,
  Phone,
  User,
  AlertTriangle,
  ChevronDown,
  Tag,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Data types
interface Country {
  id: string;
  name: string;
  code: string | null;
  phoneCode: string | null;
  currency: string | null;
  isActive: boolean;
  _count?: { divisions: number };
}

interface Division {
  id: string;
  countryId: string;
  name: string;
  code: string | null;
  isActive: boolean;
  country?: { id: string; name: string; code: string | null };
  _count?: { districts: number };
}

interface District {
  id: string;
  divisionId: string;
  name: string;
  code: string | null;
  isActive: boolean;
  division?: {
    id: string;
    name: string;
    country?: { id: string; name: string };
  };
  _count?: { areas: number };
}

interface Area {
  id: string;
  districtId: string;
  name: string;
  postalCode: string | null;
  isActive: boolean;
  district?: {
    id: string;
    name: string;
    division?: {
      id: string;
      name: string;
      country?: { id: string; name: string };
    };
  };
  _count?: { shops?: number };
}

interface Shop {
  id: string;
  areaId: string;
  name: string;
  code: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  area?: {
    id: string;
    name: string;
    district?: {
      id: string;
      name: string;
      division?: {
        id: string;
        name: string;
        country?: { id: string; name: string };
      };
    };
  };
  _count?: { products: number };
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  description: string | null;
  isActive: boolean;
  children?: { id: string; name: string; isActive: boolean }[];
  _count?: { products: number; subProducts?: number; children: number };
}

export function CategoriesLocationsClient() {
  const [activeTab, setActiveTab] = React.useState<"categories" | "shops" | "geo">("categories");
  const [geoTab, setGeoTab] = React.useState<"cascade" | "countries" | "divisions" | "districts" | "areas">("cascade");

  // Loading states
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Data lists
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [shops, setShops] = React.useState<Shop[]>([]);
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [areas, setAreas] = React.useState<Area[]>([]);

  // Search & Filters
  const [searchCategory, setSearchCategory] = React.useState("");
  const [searchShop, setSearchShop] = React.useState("");
  const [filterParentCategory, setFilterParentCategory] = React.useState<string>("ALL");
  const [filterShopArea, setFilterShopArea] = React.useState<string>("ALL");

  // Modals & Editing states
  const [modalCategoryOpen, setModalCategoryOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = React.useState({
    name: "",
    parentId: "",
    description: "",
    isActive: true,
  });

  const [modalShopOpen, setModalShopOpen] = React.useState(false);
  const [editingShop, setEditingShop] = React.useState<Shop | null>(null);
  const [shopForm, setShopForm] = React.useState({
    areaId: "",
    name: "",
    code: "",
    address: "",
    contactName: "",
    contactPhone: "",
    isActive: true,
  });

  // Geo form modals
  const [geoModalOpen, setGeoModalOpen] = React.useState<"country" | "division" | "district" | "area" | null>(null);
  const [editingGeo, setEditingGeo] = React.useState<any>(null);
  const [geoCountryForm, setGeoCountryForm] = React.useState({ name: "", code: "", phoneCode: "+880", currency: "BDT", isActive: true });
  const [geoDivisionForm, setGeoDivisionForm] = React.useState({ countryId: "", name: "", code: "", isActive: true });
  const [geoDistrictForm, setGeoDistrictForm] = React.useState({ divisionId: "", name: "", code: "", isActive: true });
  const [geoAreaForm, setGeoAreaForm] = React.useState({ districtId: "", name: "", postalCode: "", isActive: true });

  // Cascade interactive explorer selections
  const [selCountry, setSelCountry] = React.useState<string>("");
  const [selDivision, setSelDivision] = React.useState<string>("");
  const [selDistrict, setSelDistrict] = React.useState<string>("");
  const [selArea, setSelArea] = React.useState<string>("");

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "category" | "shop" | "country" | "division" | "district" | "area";
    id: string;
    name: string;
    warnings?: string[];
  } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Initial Fetch
  const loadAll = async () => {
    setLoading(true);
    try {
      const [catRes, shopRes, cRes, dRes, distRes, aRes] = await Promise.all([
        fetch("/api/configuration/categories"),
        fetch("/api/configuration/shops"),
        fetch("/api/configuration/geo/countries"),
        fetch("/api/configuration/geo/divisions"),
        fetch("/api/configuration/geo/districts"),
        fetch("/api/configuration/geo/areas"),
      ]);

      const [catData, shopData, cData, dData, distData, aData] = await Promise.all([
        catRes.json(),
        shopRes.json(),
        cRes.json(),
        dRes.json(),
        distRes.json(),
        aRes.json(),
      ]);

      if (catData.data) setCategories(catData.data);
      if (shopData.data) setShops(shopData.data);
      if (cData.data) {
        setCountries(cData.data);
        if (cData.data.length > 0 && !selCountry) setSelCountry(cData.data[0].id);
      }
      if (dData.data) setDivisions(dData.data);
      if (distData.data) setDistricts(distData.data);
      if (aData.data) setAreas(aData.data);
    } catch {
      toast.error("Failed to load categories & locations");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAll();
  }, []);

  // Update cascade selections on parent changes
  React.useEffect(() => {
    const divs = divisions.filter((d) => d.countryId === selCountry);
    if (divs.length > 0 && (!selDivision || !divs.find((d) => d.id === selDivision))) {
      setSelDivision(divs[0].id);
    } else if (divs.length === 0) {
      setSelDivision("");
      setSelDistrict("");
      setSelArea("");
    }
  }, [selCountry, divisions]);

  React.useEffect(() => {
    const dists = districts.filter((d) => d.divisionId === selDivision);
    if (dists.length > 0 && (!selDistrict || !dists.find((d) => d.id === selDistrict))) {
      setSelDistrict(dists[0].id);
    } else if (dists.length === 0) {
      setSelDistrict("");
      setSelArea("");
    }
  }, [selDivision, districts]);

  React.useEffect(() => {
    const ars = areas.filter((a) => a.districtId === selDistrict);
    if (ars.length > 0 && (!selArea || !ars.find((a) => a.id === selArea))) {
      setSelArea(ars[0].id);
    } else if (ars.length === 0) {
      setSelArea("");
    }
  }, [selDistrict, areas]);

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const handleOpenAddCategory = (parentId?: string) => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      parentId: parentId || "",
      description: "",
      isActive: true,
    });
    setModalCategoryOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      parentId: cat.parentId || "",
      description: cat.description || "",
      isActive: cat.isActive,
    });
    setModalCategoryOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      const url = "/api/configuration/categories";
      const method = editingCategory ? "PUT" : "POST";
      const payload = editingCategory
        ? { id: editingCategory.id, ...categoryForm }
        : categoryForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save category");
        return;
      }

      toast.success(editingCategory ? "Category updated!" : "Category created!");
      setModalCategoryOpen(false);
      // Reload categories
      const refresh = await fetch("/api/configuration/categories");
      const refData = await refresh.json();
      if (refData.data) setCategories(refData.data);
    } catch {
      toast.error("An error occurred while saving category");
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteCategory = (cat: Category) => {
    const childCount = categories.filter((c) => c.parentId === cat.id).length;
    const prodCount = (cat._count?.products || 0) + (cat._count?.subProducts || 0);

    const warnings: string[] = [];
    if (childCount > 0) {
      warnings.push(`${childCount} subcategory(ies) under this category will also be deleted`);
    }
    if (prodCount > 0) {
      warnings.push(`${prodCount} product(s) assigned will be unassigned (products will not be deleted)`);
    }

    setDeleteTarget({
      type: "category",
      id: cat.id,
      name: cat.name,
      warnings,
    });
  };

  // Toggle Category Status
  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      const res = await fetch("/api/configuration/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
      });
      if (res.ok) {
        toast.success(`Category ${!cat.isActive ? "activated" : "deactivated"}`);
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ==========================================
  // SHOP ACTIONS
  // ==========================================
  const handleOpenAddShop = (prefillAreaId?: string) => {
    setEditingShop(null);
    setShopForm({
      areaId: prefillAreaId || (areas.length > 0 ? areas[0].id : ""),
      name: "",
      code: "",
      address: "",
      contactName: "",
      contactPhone: "",
      isActive: true,
    });
    setModalShopOpen(true);
  };

  const handleOpenEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setShopForm({
      areaId: shop.areaId,
      name: shop.name,
      code: shop.code || "",
      address: shop.address || "",
      contactName: shop.contactName || "",
      contactPhone: shop.contactPhone || "",
      isActive: shop.isActive,
    });
    setModalShopOpen(true);
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopForm.name.trim()) {
      toast.error("Shop name is required");
      return;
    }
    if (!shopForm.areaId) {
      toast.error("Please select an Area for this shop");
      return;
    }

    setSaving(true);
    try {
      const url = "/api/configuration/shops";
      const method = editingShop ? "PUT" : "POST";
      const payload = editingShop ? { id: editingShop.id, ...shopForm } : shopForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save shop");
        return;
      }

      toast.success(editingShop ? "Shop updated!" : "Shop created!");
      setModalShopOpen(false);
      // Refresh shops
      const refresh = await fetch("/api/configuration/shops");
      const refData = await refresh.json();
      if (refData.data) setShops(refData.data);
    } catch {
      toast.error("An error occurred while saving shop");
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteShop = (shop: Shop) => {
    const prodCount = shop._count?.products || 0;
    const warnings: string[] = [];
    if (prodCount > 0) {
      warnings.push(`${prodCount} product(s) assigned to this shop branch will be unassigned`);
    }

    setDeleteTarget({
      type: "shop",
      id: shop.id,
      name: shop.name,
      warnings,
    });
  };

  const handleToggleShopActive = async (shop: Shop) => {
    try {
      const res = await fetch("/api/configuration/shops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shop.id, isActive: !shop.isActive }),
      });
      if (res.ok) {
        toast.success(`Shop ${!shop.isActive ? "activated" : "deactivated"}`);
        setShops((prev) =>
          prev.map((s) => (s.id === shop.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ==========================================
  // GEO ACTIONS
  // ==========================================
  const handleSaveGeo = async (type: "country" | "division" | "district" | "area", e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = `/api/configuration/geo/${type}s`;
      let payload: any = {};

      if (type === "country") payload = { ...geoCountryForm };
      if (type === "division") payload = { ...geoDivisionForm };
      if (type === "district") payload = { ...geoDistrictForm };
      if (type === "area") payload = { ...geoAreaForm };

      if (editingGeo) {
        payload.id = editingGeo.id;
      }

      const method = editingGeo ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to save ${type}`);
        return;
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} saved!`);
      setGeoModalOpen(null);
      setEditingGeo(null);
      loadAll();
    } catch {
      toast.error(`Failed to save ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteGeo = (type: "country" | "division" | "district" | "area", item: any) => {
    setDeleteTarget({
      type,
      id: item.id,
      name: item.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === "category") {
        const res = await fetch(`/api/configuration/categories?id=${deleteTarget.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to delete category");
          return;
        }
        toast.success(`Category "${deleteTarget.name}" deleted successfully`);
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id && c.parentId !== deleteTarget.id));
      } else if (deleteTarget.type === "shop") {
        const res = await fetch(`/api/configuration/shops?id=${deleteTarget.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to delete shop");
          return;
        }
        toast.success(`Shop "${deleteTarget.name}" deleted successfully`);
        setShops((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      } else {
        const res = await fetch(`/api/configuration/geo/${deleteTarget.type}s?id=${deleteTarget.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed to delete ${deleteTarget.type}`);
          return;
        }
        toast.success(`${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted successfully`);
        loadAll();
      }
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  // Grouped Categories: Parent categories and their subcategories
  const parentCategories = categories.filter((c) => !c.parentId);
  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchCategory.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchCategory.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterParentCategory === "ALL") return true;
    if (filterParentCategory === "ROOT") return !c.parentId;
    if (filterParentCategory === "SUB") return !!c.parentId;
    return c.parentId === filterParentCategory || c.id === filterParentCategory;
  });

  // Filtered Shops
  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchShop.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchShop.toLowerCase())) ||
      (s.address && s.address.toLowerCase().includes(searchShop.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterShopArea !== "ALL" && s.areaId !== filterShopArea) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading Categories, Locations & Shops...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Categories & Locations</h1>
              <p className="text-sm text-muted-foreground">
                Manage product categories, subcategories, geographic territories, and shop branches
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "categories" && (
            <Button onClick={() => handleOpenAddCategory()} className="gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          )}
          {activeTab === "shops" && (
            <Button onClick={() => handleOpenAddShop()} className="gap-2">
              <Plus className="w-4 h-4" /> Add Shop / Branch
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={loadAll} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-lg transition-colors border-b-2 ${
            activeTab === "categories"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Product Categories & Subcategories</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("shops")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-lg transition-colors border-b-2 ${
            activeTab === "shops"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Shops & Branches</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono">{shops.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("geo")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-lg transition-colors border-b-2 ${
            activeTab === "geo"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Geographic Hierarchy</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono">
            {countries.length} / {divisions.length} / {districts.length} / {areas.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PRODUCT CATEGORIES & SUBCATEGORIES                     */}
      {/* ============================================================== */}
      {activeTab === "categories" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories or subcategories..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="h-10 pl-9 pr-3 rounded-lg border border-input bg-background w-full text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <select
                value={filterParentCategory}
                onChange={(e) => setFilterParentCategory(e.target.value)}
                className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Levels</option>
                <option value="ROOT">Parent Categories Only</option>
                <option value="SUB">Subcategories Only</option>
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>
                    Under: {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Parent Category
              </span>
              <span className="flex items-center gap-1.5 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Subcategory
              </span>
            </div>
          </div>

          {/* Hierarchical Categories View */}
          <div className="grid grid-cols-1 gap-4">
            {parentCategories.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold">No Categories Configured</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Create parent fabric categories (e.g., Silk, Cotton, Linen) and nest subcategories
                    (e.g., Raw Silk, Printed Cotton) underneath them.
                  </p>
                  <Button onClick={() => handleOpenAddCategory()} className="gap-2">
                    <Plus className="w-4 h-4" /> Create First Category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              parentCategories
                .filter((p) => {
                  if (filterParentCategory === "SUB") return false;
                  if (filterParentCategory !== "ALL" && filterParentCategory !== "ROOT" && filterParentCategory !== p.id) {
                    return false;
                  }
                  if (!searchCategory) return true;
                  const selfMatch = p.name.toLowerCase().includes(searchCategory.toLowerCase());
                  const childrenMatch = categories
                    .filter((c) => c.parentId === p.id)
                    .some((c) => c.name.toLowerCase().includes(searchCategory.toLowerCase()));
                  return selfMatch || childrenMatch;
                })
                .map((parent) => {
                  const children = categories.filter((c) => c.parentId === parent.id);
                  const isFiltered =
                    searchCategory &&
                    !parent.name.toLowerCase().includes(searchCategory.toLowerCase());

                  return (
                    <Card key={parent.id} className="overflow-hidden border-border/80 shadow-sm">
                      {/* Parent Category Header Row */}
                      <div className="p-4 bg-muted/40 flex items-center justify-between border-b border-border/60">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                            <FolderTree className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                {parent.name}
                              </h3>
                              <Badge
                                variant={parent.isActive ? "default" : "secondary"}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {parent.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                {children.length} subcategories
                              </Badge>
                              {parent._count && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  ({(parent._count.products || 0) + (parent._count.subProducts || 0)} products)
                                </span>
                              )}
                            </div>
                            {parent.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {parent.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAddCategory(parent.id)}
                            className="h-8 gap-1 text-xs text-primary hover:text-primary"
                          >
                            <Plus className="w-3.5 h-3.5" /> Subcategory
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCategoryActive(parent)}
                            className="h-8 text-xs text-muted-foreground"
                          >
                            {parent.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditCategory(parent)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteCategory(parent);
                            }}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                            title={`Delete category "${parent.name}"`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories Nested List */}
                      {children.length > 0 ? (
                        <div className="divide-y divide-border/40 pl-6 pr-4 py-1 bg-background/50">
                          {children
                            .filter((child) => {
                              if (!searchCategory) return true;
                              return child.name.toLowerCase().includes(searchCategory.toLowerCase());
                            })
                            .map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between py-2.5 pl-3 group hover:bg-muted/30 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-5 bg-violet-500/50 rounded-full" />
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">
                                      {child.name}
                                    </span>
                                    <Badge
                                      variant={child.isActive ? "default" : "secondary"}
                                      className="text-[9px] px-1.5 py-0"
                                    >
                                      {child.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {child._count && (
                                      <span className="text-[11px] text-muted-foreground font-mono">
                                        ({(child._count.products || 0) + (child._count.subProducts || 0)} products)
                                      </span>
                                    )}
                                    {child.description && (
                                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                                        — {child.description}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleCategoryActive(child)}
                                    className="h-7 text-xs text-muted-foreground"
                                  >
                                    {child.isActive ? "Deactivate" : "Activate"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEditCategory(child)}
                                    className="h-7 w-7 text-muted-foreground"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      promptDeleteCategory(child);
                                    }}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                                    title={`Delete subcategory "${child.name}"`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="py-3 px-6 text-xs text-muted-foreground italic flex items-center justify-between">
                          <span>No subcategories created under {parent.name} yet.</span>
                          <button
                            onClick={() => handleOpenAddCategory(parent.id)}
                            className="text-primary hover:underline font-medium text-xs flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add first subcategory
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SHOPS & STORE BRANCHES                                 */}
      {/* ============================================================== */}
      {activeTab === "shops" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search shops by name, code or address..."
                  value={searchShop}
                  onChange={(e) => setSearchShop(e.target.value)}
                  className="h-10 pl-9 pr-3 rounded-lg border border-input bg-background w-full text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <select
                value={filterShopArea}
                onChange={(e) => setFilterShopArea(e.target.value)}
                className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Areas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    Area: {a.name}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={() => handleOpenAddShop()} className="gap-2">
              <Plus className="w-4 h-4" /> Add Shop
            </Button>
          </div>

          {filteredShops.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold">No Shops Found</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Shops represent physical store branches or retail outlets tied directly to an Area in your location hierarchy.
                </p>
                <Button onClick={() => handleOpenAddShop()} className="gap-2">
                  <Plus className="w-4 h-4" /> Create First Shop
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShops.map((shop) => {
                const area = shop.area;
                const district = area?.district;
                const division = district?.division;
                const country = division?.country;

                return (
                  <Card key={shop.id} className="border-border hover:border-primary/50 transition-colors shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-1.5">
                              {shop.name}
                            </CardTitle>
                            {shop.code && (
                              <span className="text-xs font-mono text-muted-foreground">
                                Code: {shop.code}
                              </span>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant={shop.isActive ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {shop.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0 text-xs">
                      {/* Full Location Chain Breadcrumb */}
                      <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 space-y-1">
                        <div className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                          Assigned Territory Hierarchy
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-foreground font-medium">
                          <span>{country?.name || "Country"}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                          <span>{division?.name || "Division"}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                          <span>{district?.name || "District"}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-primary font-bold">{area?.name || "Area"}</span>
                        </div>
                      </div>

                      {/* Contact and address info */}
                      {(shop.address || shop.contactName || shop.contactPhone) && (
                        <div className="space-y-1 text-muted-foreground">
                          {shop.address && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">{shop.address}</span>
                            </div>
                          )}
                          {shop.contactName && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span>{shop.contactName}</span>
                            </div>
                          )}
                          {shop.contactPhone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span>{shop.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-muted-foreground font-mono">
                          {shop._count?.products || 0} Products Attached
                        </span>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleShopActive(shop)}
                            className="h-7 text-xs"
                          >
                            {shop.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditShop(shop)}
                            className="h-7 w-7 text-muted-foreground"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteShop(shop);
                            }}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                            title={`Delete shop "${shop.name}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GEOGRAPHIC HIERARCHY EXPLORER                          */}
      {/* ============================================================== */}
      {activeTab === "geo" && (
        <div className="space-y-5">
          {/* Subtabs for Geo */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <Button
              variant={geoTab === "cascade" ? "default" : "outline"}
              size="sm"
              onClick={() => setGeoTab("cascade")}
              className="gap-1.5 text-xs"
            >
              <Navigation className="w-3.5 h-3.5" /> Interactive Cascade Browser
            </Button>
            <Button
              variant={geoTab === "countries" ? "default" : "outline"}
              size="sm"
              onClick={() => setGeoTab("countries")}
              className="gap-1.5 text-xs"
            >
              Countries ({countries.length})
            </Button>
            <Button
              variant={geoTab === "divisions" ? "default" : "outline"}
              size="sm"
              onClick={() => setGeoTab("divisions")}
              className="gap-1.5 text-xs"
            >
              Divisions ({divisions.length})
            </Button>
            <Button
              variant={geoTab === "districts" ? "default" : "outline"}
              size="sm"
              onClick={() => setGeoTab("districts")}
              className="gap-1.5 text-xs"
            >
              Districts ({districts.length})
            </Button>
            <Button
              variant={geoTab === "areas" ? "default" : "outline"}
              size="sm"
              onClick={() => setGeoTab("areas")}
              className="gap-1.5 text-xs"
            >
              Areas ({areas.length})
            </Button>
          </div>

          {/* Geo Cascade Interactive Browser */}
          {geoTab === "cascade" && (
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-primary" />
                      5-Level Geographic & Store Chain
                    </CardTitle>
                    <CardDescription>
                      Click each level to drill down from Country down to authorized Shops
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingGeo(null);
                      setGeoCountryForm({ name: "", code: "", phoneCode: "+880", currency: "BDT", isActive: true });
                      setGeoModalOpen("country");
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Country
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {/* Column 1: Countries */}
                  <div className="border border-border rounded-xl p-3 bg-card space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        1. Countries
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingGeo(null);
                          setGeoCountryForm({ name: "", code: "", phoneCode: "+880", currency: "BDT", isActive: true });
                          setGeoModalOpen("country");
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {countries.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelCountry(c.id)}
                          className={`p-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between transition-colors ${
                            selCountry === c.id
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] opacity-80">{c.code}</span>
                        </div>
                      ))}
                      {countries.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2 text-center">No countries</p>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Divisions */}
                  <div className="border border-border rounded-xl p-3 bg-card space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        2. Divisions
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={!selCountry}
                        onClick={() => {
                          setEditingGeo(null);
                          setGeoDivisionForm({ countryId: selCountry, name: "", code: "", isActive: true });
                          setGeoModalOpen("division");
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {divisions
                        .filter((d) => d.countryId === selCountry)
                        .map((d) => (
                          <div
                            key={d.id}
                            onClick={() => setSelDivision(d.id)}
                            className={`p-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between transition-colors ${
                              selDivision === d.id
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <span>{d.name}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </div>
                        ))}
                      {divisions.filter((d) => d.countryId === selCountry).length === 0 && (
                        <p className="text-xs text-muted-foreground p-2 text-center">No divisions</p>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Districts */}
                  <div className="border border-border rounded-xl p-3 bg-card space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        3. Districts
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={!selDivision}
                        onClick={() => {
                          setEditingGeo(null);
                          setGeoDistrictForm({ divisionId: selDivision, name: "", code: "", isActive: true });
                          setGeoModalOpen("district");
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {districts
                        .filter((dst) => dst.divisionId === selDivision)
                        .map((dst) => (
                          <div
                            key={dst.id}
                            onClick={() => setSelDistrict(dst.id)}
                            className={`p-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between transition-colors ${
                              selDistrict === dst.id
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <span>{dst.name}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </div>
                        ))}
                      {districts.filter((dst) => dst.divisionId === selDivision).length === 0 && (
                        <p className="text-xs text-muted-foreground p-2 text-center">No districts</p>
                      )}
                    </div>
                  </div>

                  {/* Column 4: Areas */}
                  <div className="border border-border rounded-xl p-3 bg-card space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        4. Areas
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={!selDistrict}
                        onClick={() => {
                          setEditingGeo(null);
                          setGeoAreaForm({ districtId: selDistrict, name: "", postalCode: "", isActive: true });
                          setGeoModalOpen("area");
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {areas
                        .filter((a) => a.districtId === selDistrict)
                        .map((a) => (
                          <div
                            key={a.id}
                            onClick={() => setSelArea(a.id)}
                            className={`p-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between transition-colors ${
                              selArea === a.id
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <span>{a.name}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </div>
                        ))}
                      {areas.filter((a) => a.districtId === selDistrict).length === 0 && (
                        <p className="text-xs text-muted-foreground p-2 text-center">No areas</p>
                      )}
                    </div>
                  </div>

                  {/* Column 5: Shops under Selected Area */}
                  <div className="border border-primary/30 rounded-xl p-3 bg-primary/5 space-y-2">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                      <span className="font-semibold text-xs uppercase tracking-wider text-primary flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" /> 5. Shops
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/20"
                        disabled={!selArea}
                        onClick={() => handleOpenAddShop(selArea)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {shops
                        .filter((s) => s.areaId === selArea)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="p-2.5 rounded-lg bg-card border border-border text-xs font-medium space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">{s.name}</span>
                              <Badge
                                variant={s.isActive ? "default" : "secondary"}
                                className="text-[9px] px-1 py-0"
                              >
                                {s.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            {s.code && <div className="text-[10px] text-muted-foreground font-mono">Code: {s.code}</div>}
                            <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditShop(s)}
                                className="h-6 w-6 text-muted-foreground"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  promptDeleteShop(s);
                                }}
                                className="h-6 w-6 rounded flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                                title={`Delete shop "${s.name}"`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {shops.filter((s) => s.areaId === selArea).length === 0 && (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          No shops in this area.
                          {selArea && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAddShop(selArea)}
                              className="text-xs p-0 h-auto text-primary hover:text-primary hover:underline block mx-auto mt-1"
                            >
                              + Add shop now
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List views for individual levels */}
          {geoTab === "countries" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Countries</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingGeo(null);
                    setGeoCountryForm({ name: "", code: "", phoneCode: "+880", currency: "BDT", isActive: true });
                    setGeoModalOpen("country");
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Country
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {countries.map((c) => (
                    <div key={c.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Code: {c.code || "—"} | Phone: {c.phoneCode || "—"} | Currency: {c.currency || "BDT"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGeo(c);
                            setGeoCountryForm({
                              name: c.name,
                              code: c.code || "",
                              phoneCode: c.phoneCode || "",
                              currency: c.currency || "BDT",
                              isActive: c.isActive,
                            });
                            setGeoModalOpen("country");
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteGeo("country", c);
                          }}
                          title={`Delete country "${c.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {geoTab === "divisions" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Divisions</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingGeo(null);
                    setGeoDivisionForm({
                      countryId: countries.length > 0 ? countries[0].id : "",
                      name: "",
                      code: "",
                      isActive: true,
                    });
                    setGeoModalOpen("division");
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Division
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {divisions.map((d) => (
                    <div key={d.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{d.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Country: {d.country?.name || "—"} {d.code ? `| Code: ${d.code}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGeo(d);
                            setGeoDivisionForm({
                              countryId: d.countryId,
                              name: d.name,
                              code: d.code || "",
                              isActive: d.isActive,
                            });
                            setGeoModalOpen("division");
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteGeo("division", d);
                          }}
                          title={`Delete division "${d.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {geoTab === "districts" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Districts</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingGeo(null);
                    setGeoDistrictForm({
                      divisionId: divisions.length > 0 ? divisions[0].id : "",
                      name: "",
                      code: "",
                      isActive: true,
                    });
                    setGeoModalOpen("district");
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add District
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {districts.map((dst) => (
                    <div key={dst.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{dst.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Division: {dst.division?.name || "—"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGeo(dst);
                            setGeoDistrictForm({
                              divisionId: dst.divisionId,
                              name: dst.name,
                              code: dst.code || "",
                              isActive: dst.isActive,
                            });
                            setGeoModalOpen("district");
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteGeo("district", dst);
                          }}
                          title={`Delete district "${dst.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {geoTab === "areas" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Areas</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingGeo(null);
                    setGeoAreaForm({
                      districtId: districts.length > 0 ? districts[0].id : "",
                      name: "",
                      postalCode: "",
                      isActive: true,
                    });
                    setGeoModalOpen("area");
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Area
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {areas.map((a) => (
                    <div key={a.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          District: {a.district?.name || "—"} {a.postalCode ? `| Postal: ${a.postalCode}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGeo(a);
                            setGeoAreaForm({
                              districtId: a.districtId,
                              name: a.name,
                              postalCode: a.postalCode || "",
                              isActive: a.isActive,
                            });
                            setGeoModalOpen("area");
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteGeo("area", a);
                          }}
                          title={`Delete area "${a.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CATEGORY (ADD / EDIT)                                   */}
      {/* ============================================================== */}
      {modalCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={() => setModalCategoryOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cotton Fabrics, Silk, Handloom"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Parent Category
                </label>
                <select
                  value={categoryForm.parentId}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— None (Top-Level Parent Category) —</option>
                  {parentCategories
                    .filter((p) => !editingCategory || p.id !== editingCategory.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty if this is a top-level parent category.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Notes about this fabric category or subcategory..."
                  className="w-full p-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="catActive" className="text-sm font-medium text-foreground cursor-pointer">
                  Active (available for product assignment)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalCategoryOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SHOP (ADD / EDIT)                                       */}
      {/* ============================================================== */}
      {modalShopOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">
                {editingShop ? "Edit Shop / Branch" : "Add New Shop / Branch"}
              </h2>
              <button
                onClick={() => setModalShopOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Parent Area <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={shopForm.areaId}
                  onChange={(e) => setShopForm((f) => ({ ...f, areaId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Area —</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.district?.name || "District"}, {a.district?.division?.name || "Division"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Shop / Store Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shopForm.name}
                    onChange={(e) => setShopForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Dhanmondi Outlet 1"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Shop Code
                  </label>
                  <input
                    type="text"
                    value={shopForm.code}
                    onChange={(e) => setShopForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. SHP-DHN-01"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  value={shopForm.address}
                  onChange={(e) => setShopForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. House 42, Road 27, Dhanmondi"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={shopForm.contactName}
                    onChange={(e) => setShopForm((f) => ({ ...f, contactName: e.target.value }))}
                    placeholder="Branch Manager Name"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={shopForm.contactPhone}
                    onChange={(e) => setShopForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="shopActive"
                  checked={shopForm.isActive}
                  onChange={(e) => setShopForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="shopActive" className="text-sm font-medium text-foreground cursor-pointer">
                  Active (available for POS cutting and product assignment)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setModalShopOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingShop ? "Update Shop" : "Create Shop"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GEO (COUNTRY / DIVISION / DISTRICT / AREA)              */}
      {/* ============================================================== */}
      {geoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground capitalize">
                {editingGeo ? `Edit ${geoModalOpen}` : `Add New ${geoModalOpen}`}
              </h2>
              <button
                onClick={() => setGeoModalOpen(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveGeo(geoModalOpen, e)} className="space-y-4">
              {/* COUNTRY FIELDS */}
              {geoModalOpen === "country" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Country Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={geoCountryForm.name}
                      onChange={(e) => setGeoCountryForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Bangladesh"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Code (ISO)
                      </label>
                      <input
                        type="text"
                        value={geoCountryForm.code}
                        onChange={(e) => setGeoCountryForm((f) => ({ ...f, code: e.target.value }))}
                        placeholder="BD"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Phone Code
                      </label>
                      <input
                        type="text"
                        value={geoCountryForm.phoneCode}
                        onChange={(e) => setGeoCountryForm((f) => ({ ...f, phoneCode: e.target.value }))}
                        placeholder="+880"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* DIVISION FIELDS */}
              {geoModalOpen === "division" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Parent Country <span className="text-destructive">*</span>
                    </label>
                    <select
                      required
                      value={geoDivisionForm.countryId}
                      onChange={(e) => setGeoDivisionForm((f) => ({ ...f, countryId: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— Select Country —</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Division Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={geoDivisionForm.name}
                      onChange={(e) => setGeoDivisionForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Dhaka, Chittagong, Sylhet"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </>
              )}

              {/* DISTRICT FIELDS */}
              {geoModalOpen === "district" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Parent Division <span className="text-destructive">*</span>
                    </label>
                    <select
                      required
                      value={geoDistrictForm.divisionId}
                      onChange={(e) => setGeoDistrictForm((f) => ({ ...f, divisionId: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— Select Division —</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.country?.name || "Country"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      District Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={geoDistrictForm.name}
                      onChange={(e) => setGeoDistrictForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Dhaka, Gazipur, Narayanganj"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </>
              )}

              {/* AREA FIELDS */}
              {geoModalOpen === "area" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Parent District <span className="text-destructive">*</span>
                    </label>
                    <select
                      required
                      value={geoAreaForm.districtId}
                      onChange={(e) => setGeoAreaForm((f) => ({ ...f, districtId: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— Select District —</option>
                      {districts.map((dst) => (
                        <option key={dst.id} value={dst.id}>
                          {dst.name} ({dst.division?.name || "Division"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Area Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={geoAreaForm.name}
                        onChange={(e) => setGeoAreaForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Mirpur, Gulshan"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={geoAreaForm.postalCode}
                        onChange={(e) => setGeoAreaForm((f) => ({ ...f, postalCode: e.target.value }))}
                        placeholder="1216"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setGeoModalOpen(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingGeo ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL                                      */}
      {/* ============================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border/80 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground">
                  Delete {deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)}?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deleteTarget.name}&quot;</span>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteTarget.warnings && deleteTarget.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Please note before deleting:
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90">
                  {deleteTarget.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5 cursor-pointer"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
