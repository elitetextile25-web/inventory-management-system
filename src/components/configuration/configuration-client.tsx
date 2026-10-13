"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sliders,
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  description: string | null;
  isActive: boolean;
  children?: { id: string; name: string }[];
  _count?: { products: number; children: number };
}

export function ConfigurationClient() {
  const [activeMainTab, setActiveMainTab] = React.useState<"geo" | "categories">("geo");
  const [geoSubTab, setGeoSubTab] = React.useState<"cascade" | "countries" | "divisions" | "districts" | "areas">("cascade");

  // Loading states
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Data lists
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [areas, setAreas] = React.useState<Area[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCountryId, setSelectedCountryId] = React.useState<string>("");
  const [selectedDivisionId, setSelectedDivisionId] = React.useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = React.useState<string>("");

  // Modals state
  const [showCascadingModal, setShowCascadingModal] = React.useState(false);
  const [showCountryModal, setShowCountryModal] = React.useState(false);
  const [showDivisionModal, setShowDivisionModal] = React.useState(false);
  const [showDistrictModal, setShowDistrictModal] = React.useState(false);
  const [showAreaModal, setShowAreaModal] = React.useState(false);
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);

  // Edit target
  const [editingItem, setEditingItem] = React.useState<any>(null);

  // Forms
  const [cascadeForm, setCascadeForm] = React.useState({
    countryMode: "select" as "select" | "new",
    countryId: "",
    newCountryName: "",
    countryCode: "BD",
    divisionMode: "select" as "select" | "new",
    divisionId: "",
    newDivisionName: "",
    districtMode: "select" as "select" | "new",
    districtId: "",
    newDistrictName: "",
    areaName: "",
    postalCode: "",
  });

  const [countryForm, setCountryForm] = React.useState({
    name: "",
    code: "",
    phoneCode: "",
    currency: "",
    isActive: true,
  });

  const [divisionForm, setDivisionForm] = React.useState({
    countryId: "",
    name: "",
    code: "",
    isActive: true,
  });

  const [districtForm, setDistrictForm] = React.useState({
    divisionId: "",
    name: "",
    code: "",
    isActive: true,
  });

  const [areaForm, setAreaForm] = React.useState({
    districtId: "",
    name: "",
    postalCode: "",
    isActive: true,
  });

  const [categoryForm, setCategoryForm] = React.useState({
    name: "",
    parentId: "",
    description: "",
    isActive: true,
  });

  // Fetch all configuration data
  const fetchAllData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, dRes, distRes, aRes, catRes] = await Promise.all([
        fetch("/api/configuration/geo/countries"),
        fetch("/api/configuration/geo/divisions"),
        fetch("/api/configuration/geo/districts"),
        fetch("/api/configuration/geo/areas"),
        fetch("/api/configuration/categories"),
      ]);

      const [cData, dData, distData, aData, catData] = await Promise.all([
        cRes.json(),
        dRes.json(),
        distRes.json(),
        aRes.json(),
        catRes.json(),
      ]);

      const fetchedCountries = cData.data || [];
      const fetchedDivisions = dData.data || [];
      const fetchedDistricts = distData.data || [];

      setCountries(fetchedCountries);
      setDivisions(fetchedDivisions);
      setDistricts(fetchedDistricts);
      setAreas(aData.data || []);
      setCategories(catData.data || []);

      // Auto-select first country if none selected
      if (!selectedCountryId && fetchedCountries.length > 0) {
        setSelectedCountryId(fetchedCountries[0].id);
        setCascadeForm((prev) => ({ ...prev, countryId: fetchedCountries[0].id }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load configuration data");
    } finally {
      setLoading(false);
    }
  }, [selectedCountryId]);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Sync cascading dropdowns when selectedCountry changes
  const availableDivisions = React.useMemo(() => {
    if (!selectedCountryId) return divisions;
    return divisions.filter((d) => d.countryId === selectedCountryId);
  }, [divisions, selectedCountryId]);

  const availableDistricts = React.useMemo(() => {
    if (!selectedDivisionId) {
      if (selectedCountryId) {
        const divIds = availableDivisions.map((d) => d.id);
        return districts.filter((dist) => divIds.includes(dist.divisionId));
      }
      return districts;
    }
    return districts.filter((dist) => dist.divisionId === selectedDivisionId);
  }, [districts, selectedDivisionId, selectedCountryId, availableDivisions]);

  const filteredAreas = React.useMemo(() => {
    return areas.filter((a) => {
      const matchesSearch =
        !searchTerm ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.postalCode && a.postalCode.includes(searchTerm)) ||
        (a.district?.name && a.district.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDistrict = !selectedDistrictId || a.districtId === selectedDistrictId;
      const matchesDivision =
        !selectedDivisionId || a.district?.division?.id === selectedDivisionId;
      const matchesCountry =
        !selectedCountryId || a.district?.division?.country?.id === selectedCountryId;

      return matchesSearch && matchesDistrict && matchesDivision && matchesCountry;
    });
  }, [areas, searchTerm, selectedDistrictId, selectedDivisionId, selectedCountryId]);

  // CASCADING SINGLE-FLOW HANDLER: User writes Country -> Division -> District -> Area
  const handleCascadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // 1. Resolve Country
      let targetCountryId = cascadeForm.countryId;
      if (cascadeForm.countryMode === "new") {
        if (!cascadeForm.newCountryName.trim()) {
          toast.error("Please enter a country name");
          setSaving(false);
          return;
        }
        const cRes = await fetch("/api/configuration/geo/countries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cascadeForm.newCountryName.trim(),
            code: cascadeForm.countryCode.trim().toUpperCase() || null,
          }),
        });
        const cJson = await cRes.json();
        if (!cRes.ok) throw new Error(cJson.error || "Failed to create country");
        targetCountryId = cJson.data.id;
      }

      if (!targetCountryId) {
        toast.error("Please select or specify a country");
        setSaving(false);
        return;
      }

      // 2. Resolve Division
      let targetDivisionId = cascadeForm.divisionId;
      if (cascadeForm.divisionMode === "new") {
        if (!cascadeForm.newDivisionName.trim()) {
          toast.error("Please enter a division name");
          setSaving(false);
          return;
        }
        const dRes = await fetch("/api/configuration/geo/divisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryId: targetCountryId,
            name: cascadeForm.newDivisionName.trim(),
          }),
        });
        const dJson = await dRes.json();
        if (!dRes.ok) throw new Error(dJson.error || "Failed to create division");
        targetDivisionId = dJson.data.id;
      }

      if (!targetDivisionId) {
        toast.error("Please select or specify a division");
        setSaving(false);
        return;
      }

      // 3. Resolve District
      let targetDistrictId = cascadeForm.districtId;
      if (cascadeForm.districtMode === "new") {
        if (!cascadeForm.newDistrictName.trim()) {
          toast.error("Please enter a district name");
          setSaving(false);
          return;
        }
        const distRes = await fetch("/api/configuration/geo/districts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            divisionId: targetDivisionId,
            name: cascadeForm.newDistrictName.trim(),
          }),
        });
        const distJson = await distRes.json();
        if (!distRes.ok) throw new Error(distJson.error || "Failed to create district");
        targetDistrictId = distJson.data.id;
      }

      if (!targetDistrictId) {
        toast.error("Please select or specify a district");
        setSaving(false);
        return;
      }

      // 4. Create Area
      if (!cascadeForm.areaName.trim()) {
        toast.error("Please enter the area name");
        setSaving(false);
        return;
      }

      const aRes = await fetch("/api/configuration/geo/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: targetDistrictId,
          name: cascadeForm.areaName.trim(),
          postalCode: cascadeForm.postalCode.trim() || null,
        }),
      });
      const aJson = await aRes.json();
      if (!aRes.ok) throw new Error(aJson.error || "Failed to create area");

      toast.success(
        `Successfully configured location: ${cascadeForm.areaName} (${cascadeForm.divisionMode === "new" ? cascadeForm.newDivisionName : "Division"}, ${cascadeForm.districtMode === "new" ? cascadeForm.newDistrictName : "District"})`
      );

      // Reset form
      setCascadeForm({
        countryMode: "select",
        countryId: targetCountryId,
        newCountryName: "",
        countryCode: "BD",
        divisionMode: "select",
        divisionId: targetDivisionId,
        newDivisionName: "",
        districtMode: "select",
        districtId: targetDistrictId,
        newDistrictName: "",
        areaName: "",
        postalCode: "",
      });

      setShowCascadingModal(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // CATEGORY SUBMIT HANDLER
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setSaving(true);
      const url = "/api/configuration/categories";
      const method = editingItem ? "PUT" : "POST";
      const payload = {
        ...(editingItem ? { id: editingItem.id } : {}),
        name: categoryForm.name.trim(),
        parentId: categoryForm.parentId || null,
        description: categoryForm.description.trim() || null,
        isActive: categoryForm.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save category");

      toast.success(editingItem ? "Category updated successfully!" : "Category created successfully!");
      setShowCategoryModal(false);
      setEditingItem(null);
      setCategoryForm({ name: "", parentId: "", description: "", isActive: true });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE CATEGORY
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/configuration/categories?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      toast.success("Category deleted");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // DELETE GEO ITEM
  const handleDeleteGeo = async (type: "country" | "division" | "district" | "area", id: string, name: string) => {
    if (!confirm(`Delete ${type} "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/configuration/geo/${type}s?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to delete ${type}`);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
  const selectClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Store Configuration</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Setup and manage hierarchical geographic territories, store configuration, and category trees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/categories-locations" className="flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-primary" />
              <span>Categories & Locations</span>
            </Link>
          </Button>

          <Button variant="outline" size="sm" onClick={() => fetchAllData()} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {activeMainTab === "geo" ? (
            <Button
              size="sm"
              className="kpi-gradient-blue text-white"
              onClick={() => {
                setCascadeForm({
                  countryMode: "select",
                  countryId: selectedCountryId || (countries[0]?.id || ""),
                  newCountryName: "",
                  countryCode: "BD",
                  divisionMode: "select",
                  divisionId: selectedDivisionId || (availableDivisions[0]?.id || ""),
                  newDivisionName: "",
                  districtMode: "select",
                  districtId: selectedDistrictId || (availableDistricts[0]?.id || ""),
                  newDistrictName: "",
                  areaName: "",
                  postalCode: "",
                });
                setShowCascadingModal(true);
              }}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Configure New Area (Hierarchy)
            </Button>
          ) : (
            <Button
              size="sm"
              className="kpi-gradient-purple text-white"
              onClick={() => {
                setEditingItem(null);
                setCategoryForm({ name: "", parentId: "", description: "", isActive: true });
                setShowCategoryModal(true);
              }}
            >
              <FolderPlus className="w-4 h-4 mr-1.5" />
              Add Product Category
            </Button>
          )}
        </div>
      </div>

      {/* Main Module Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveMainTab("geo")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeMainTab === "geo"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="w-4 h-4" />
          Geographic Hierarchy (Country ➔ Division ➔ District ➔ Area)
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-bold">
            {areas.length} Areas
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab("categories")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeMainTab === "categories"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Category Configuration
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-600 font-bold">
            {categories.length} Categories
          </span>
        </button>
      </div>

      {/* ─────────────────── TAB 1: GEOGRAPHIC CONFIGURATION ─────────────────── */}
      {activeMainTab === "geo" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Countries</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{countries.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Divisions</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{divisions.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Districts</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{districts.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Navigation className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Areas / Zones</p>
                  <p className="text-2xl font-bold mt-1 text-primary">{areas.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cascading Creation Banner */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Hierarchical Location Generator
                </p>
                <p className="text-xs text-muted-foreground">
                  Write or select: <span className="font-medium text-foreground">Country Name</span> ➔ <span className="font-medium text-foreground">Division Name</span> ➔ <span className="font-medium text-foreground">District Name</span> ➔ <span className="font-medium text-foreground">Area Name</span>.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setCascadeForm({
                  countryMode: "select",
                  countryId: selectedCountryId || (countries[0]?.id || ""),
                  newCountryName: "",
                  countryCode: "BD",
                  divisionMode: "select",
                  divisionId: selectedDivisionId || (availableDivisions[0]?.id || ""),
                  newDivisionName: "",
                  districtMode: "select",
                  districtId: selectedDistrictId || (availableDistricts[0]?.id || ""),
                  newDistrictName: "",
                  areaName: "",
                  postalCode: "",
                });
                setShowCascadingModal(true);
              }}
            >
              Open Location Creator
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>

          {/* Sub Navigation & Filter Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setGeoSubTab("cascade")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  geoSubTab === "cascade"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Explorer & Areas List
              </button>
              <button
                onClick={() => setGeoSubTab("countries")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  geoSubTab === "countries"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Countries ({countries.length})
              </button>
              <button
                onClick={() => setGeoSubTab("divisions")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  geoSubTab === "divisions"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Divisions ({divisions.length})
              </button>
              <button
                onClick={() => setGeoSubTab("districts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  geoSubTab === "districts"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Districts ({districts.length})
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCountryId}
                onChange={(e) => {
                  setSelectedCountryId(e.target.value);
                  setSelectedDivisionId("");
                  setSelectedDistrictId("");
                }}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDivisionId}
                onChange={(e) => {
                  setSelectedDivisionId(e.target.value);
                  setSelectedDistrictId("");
                }}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
              >
                <option value="">All Divisions</option>
                {availableDivisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-ring"
              >
                <option value="">All Districts</option>
                {availableDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {(selectedCountryId || selectedDivisionId || selectedDistrictId) && (
                <button
                  onClick={() => {
                    setSelectedCountryId("");
                    setSelectedDivisionId("");
                    setSelectedDistrictId("");
                  }}
                  className="text-xs text-primary hover:underline px-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Sub-View: Areas & Cascading Explorer */}
          {geoSubTab === "cascade" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Configured Areas & Locations
                  </CardTitle>
                  <CardDescription>
                    All registered delivery zones and geographic areas linked to their parent District, Division, and Country.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search area or postal code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-input bg-background focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAreaForm({
                        districtId: selectedDistrictId || (districts[0]?.id || ""),
                        name: "",
                        postalCode: "",
                        isActive: true,
                      });
                      setShowAreaModal(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New Area
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y border-border">
                      <tr>
                        <th className="px-4 py-3">Area Name</th>
                        <th className="px-4 py-3">Postal Code</th>
                        <th className="px-4 py-3">District</th>
                        <th className="px-4 py-3">Division</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredAreas.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs">
                            No areas found. Click &quot;Configure New Area (Hierarchy)&quot; to add one.
                          </td>
                        </tr>
                      ) : (
                        filteredAreas.map((a) => (
                          <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {a.name}
                            </td>
                            <td className="px-4 py-3">
                              {a.postalCode ? (
                                <Badge variant="outline" className="font-mono text-[11px]">
                                  {a.postalCode}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">
                              {a.district?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {a.district?.division?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                {a.district?.division?.country?.name || "Bangladesh"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  a.isActive
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {a.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingItem(a);
                                    setAreaForm({
                                      districtId: a.districtId,
                                      name: a.name,
                                      postalCode: a.postalCode || "",
                                      isActive: a.isActive,
                                    });
                                    setShowAreaModal(true);
                                  }}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGeo("area", a.id, a.name)}
                                  className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-View: Countries Table */}
          {geoSubTab === "countries" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Countries Configuration
                  </CardTitle>
                  <CardDescription>Top-level territory for multi-country operations.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setCountryForm({ name: "", code: "", phoneCode: "", currency: "BDT", isActive: true });
                    setShowCountryModal(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Country
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y border-border">
                      <tr>
                        <th className="px-4 py-3">Country Name</th>
                        <th className="px-4 py-3">ISO Code</th>
                        <th className="px-4 py-3">Phone Dial Code</th>
                        <th className="px-4 py-3">Default Currency</th>
                        <th className="px-4 py-3">Divisions Linked</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {countries.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground">{c.name}</td>
                          <td className="px-4 py-3 font-mono text-xs">{c.code || "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs">{c.phoneCode || "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs">{c.currency || "BDT"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{c._count?.divisions || 0} Divisions</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={c.isActive ? "success" : "muted"}>
                              {c.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingItem(c);
                                  setCountryForm({
                                    name: c.name,
                                    code: c.code || "",
                                    phoneCode: c.phoneCode || "",
                                    currency: c.currency || "BDT",
                                    isActive: c.isActive,
                                  });
                                  setShowCountryModal(true);
                                }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGeo("country", c.id, c.name)}
                                className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-View: Divisions Table */}
          {geoSubTab === "divisions" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    Divisions / States Configuration
                  </CardTitle>
                  <CardDescription>Second-tier geographic region linked to a country.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setDivisionForm({
                      countryId: selectedCountryId || (countries[0]?.id || ""),
                      name: "",
                      code: "",
                      isActive: true,
                    });
                    setShowDivisionModal(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Division
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y border-border">
                      <tr>
                        <th className="px-4 py-3">Division Name</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Parent Country</th>
                        <th className="px-4 py-3">Districts Linked</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {availableDivisions.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground">{d.name}</td>
                          <td className="px-4 py-3 font-mono text-xs">{d.code || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.country?.name || "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{d._count?.districts || 0} Districts</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={d.isActive ? "success" : "muted"}>
                              {d.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingItem(d);
                                  setDivisionForm({
                                    countryId: d.countryId,
                                    name: d.name,
                                    code: d.code || "",
                                    isActive: d.isActive,
                                  });
                                  setShowDivisionModal(true);
                                }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGeo("division", d.id, d.name)}
                                className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-View: Districts Table */}
          {geoSubTab === "districts" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    Districts / Cities Configuration
                  </CardTitle>
                  <CardDescription>Third-tier administrative district linked to a division.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setDistrictForm({
                      divisionId: selectedDivisionId || (availableDivisions[0]?.id || ""),
                      name: "",
                      code: "",
                      isActive: true,
                    });
                    setShowDistrictModal(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add District
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y border-border">
                      <tr>
                        <th className="px-4 py-3">District Name</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Parent Division</th>
                        <th className="px-4 py-3">Parent Country</th>
                        <th className="px-4 py-3">Areas Linked</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {availableDistricts.map((dist) => (
                        <tr key={dist.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground">{dist.name}</td>
                          <td className="px-4 py-3 font-mono text-xs">{dist.code || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{dist.division?.name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {dist.division?.country?.name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{dist._count?.areas || 0} Areas</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={dist.isActive ? "success" : "muted"}>
                              {dist.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingItem(dist);
                                  setDistrictForm({
                                    divisionId: dist.divisionId,
                                    name: dist.name,
                                    code: dist.code || "",
                                    isActive: dist.isActive,
                                  });
                                  setShowDistrictModal(true);
                                }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGeo("district", dist.id, dist.name)}
                                className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─────────────────── TAB 2: CATEGORY CONFIGURATION ─────────────────── */}
      {activeMainTab === "categories" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Total Categories
                </span>
                <p className="text-2xl font-bold mt-1 text-foreground">{categories.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Root Categories
                </span>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {categories.filter((c) => !c.parentId).length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Subcategories
                </span>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  {categories.filter((c) => !!c.parentId).length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Active
                </span>
                <p className="text-2xl font-bold mt-1 text-success">
                  {categories.filter((c) => c.isActive).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-purple-600" />
                  Product Categories & Subcategories
                </CardTitle>
                <CardDescription>
                  Organize fabrics, raw textiles, finished garments, and shop products into categories.
                </CardDescription>
              </div>

              <Button
                size="sm"
                className="kpi-gradient-purple text-white"
                onClick={() => {
                  setEditingItem(null);
                  setCategoryForm({ name: "", parentId: "", description: "", isActive: true });
                  setShowCategoryModal(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Category
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-y border-border">
                    <tr>
                      <th className="px-4 py-3">Category Name</th>
                      <th className="px-4 py-3">Parent / Tree</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Products Linked</th>
                      <th className="px-4 py-3">Subcategories</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs">
                          No categories configured. Click &quot;Add Category&quot; to create your first product category.
                        </td>
                      </tr>
                    ) : (
                      categories.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                            {c.parentId ? (
                              <span className="text-muted-foreground text-xs ml-3">↳</span>
                            ) : null}
                            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                            {c.name}
                          </td>
                          <td className="px-4 py-3">
                            {c.parent ? (
                              <Badge variant="outline" className="text-xs">
                                {c.parent.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground font-medium">Main Category</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                            {c.description || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="font-semibold text-xs">
                              {c._count?.products || 0} Products
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground font-medium">
                              {c._count?.children || 0} subcategories
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={c.isActive ? "success" : "muted"}>
                              {c.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingItem(c);
                                  setCategoryForm({
                                    name: c.name,
                                    parentId: c.parentId || "",
                                    description: c.description || "",
                                    isActive: c.isActive,
                                  });
                                  setShowCategoryModal(true);
                                }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(c.id, c.name)}
                                className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      )}

      {/* ─────────────────── MODAL: HIERARCHICAL CASCADING GENERATOR ─────────────────── */}
      {showCascadingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Hierarchical Location Generator
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Country ➔ Division ➔ District ➔ Area Name
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCascadingModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCascadingSubmit} className="space-y-4 pt-4">
              {/* 1. Country Level */}
              <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">1</span>
                    Country Name
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCascadeForm((f) => ({ ...f, countryMode: "select" }))}
                      className={`px-2 py-0.5 rounded ${cascadeForm.countryMode === "select" ? "bg-primary text-white font-medium" : "text-muted-foreground"}`}
                    >
                      Select Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setCascadeForm((f) => ({ ...f, countryMode: "new" }))}
                      className={`px-2 py-0.5 rounded ${cascadeForm.countryMode === "new" ? "bg-primary text-white font-medium" : "text-muted-foreground"}`}
                    >
                      + Type New Country
                    </button>
                  </div>
                </div>

                {cascadeForm.countryMode === "select" ? (
                  <select
                    value={cascadeForm.countryId}
                    onChange={(e) => setCascadeForm((f) => ({ ...f, countryId: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="">-- Choose Country --</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(${c.code})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Bangladesh"
                      value={cascadeForm.newCountryName}
                      onChange={(e) => setCascadeForm((f) => ({ ...f, newCountryName: e.target.value }))}
                      className={`${inputClass} col-span-2`}
                    />
                    <input
                      type="text"
                      placeholder="Code (BD)"
                      value={cascadeForm.countryCode}
                      onChange={(e) => setCascadeForm((f) => ({ ...f, countryCode: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* 2. Division Level */}
              <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] flex items-center justify-center font-bold">2</span>
                    Division / State
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCascadeForm((f) => ({ ...f, divisionMode: "select" }))}
                      className={`px-2 py-0.5 rounded ${cascadeForm.divisionMode === "select" ? "bg-primary text-white font-medium" : "text-muted-foreground"}`}
                    >
                      Select Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setCascadeForm((f) => ({ ...f, divisionMode: "new" }))}
                      className={`px-2 py-0.5 rounded ${cascadeForm.divisionMode === "new" ? "bg-primary text-white font-medium" : "text-muted-foreground"}`}
                    >
                      + Type New Division
                    </button>
                  </div>
                </div>

                {cascadeForm.divisionMode === "select" ? (
                  <select
                    value={cascadeForm.divisionId}
                    onChange={(e) => setCascadeForm((f) => ({ ...f, divisionId: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="">-- Choose Division --</option>
                    {divisions
                      .filter((d) => !cascadeForm.countryId || d.countryId === cascadeForm.countryId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Dhaka, Chittagong, Sylhet"
                    value={cascadeForm.newDivisionName}
                    onChange={(e) => setCascadeForm((f) => ({ ...f, newDivisionName: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </div>

              {/* 3. District Level */}
              <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] flex items-center justify-center font-bold">3</span>
                    District / City
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCascadeForm((f) => ({ ...f, districtMode: "select" }))}
                      className={`px-2 py-0.5 rounded ${cascadeForm.districtMode === "select" ? "bg-primary text-white font-medium" : "text-muted-foreground"}`}
                    >
                      Select Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setCascadeForm((f) => ({ ...f, districtMode: "new" }))}
                      className={`px-2 py-0.5 rounded ${cascadeForm.districtMode === "new" ? "bg-primary text-white font-medium" : "text-muted-foreground"}`}
                    >
                      + Type New District
                    </button>
                  </div>
                </div>

                {cascadeForm.districtMode === "select" ? (
                  <select
                    value={cascadeForm.districtId}
                    onChange={(e) => setCascadeForm((f) => ({ ...f, districtId: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="">-- Choose District --</option>
                    {districts
                      .filter((dist) => !cascadeForm.divisionId || dist.divisionId === cascadeForm.divisionId)
                      .map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Dhaka, Gazipur, Narayanganj"
                    value={cascadeForm.newDistrictName}
                    onChange={(e) => setCascadeForm((f) => ({ ...f, newDistrictName: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </div>

              {/* 4. Area Level */}
              <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 space-y-2">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">4</span>
                  Area Name & Postal Code
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Dhanmondi, Gulshan, Uttara"
                    required
                    value={cascadeForm.areaName}
                    onChange={(e) => setCascadeForm((f) => ({ ...f, areaName: e.target.value }))}
                    className={`${inputClass} col-span-2 border-primary/50`}
                  />
                  <input
                    type="text"
                    placeholder="Postal Code (1209)"
                    value={cascadeForm.postalCode}
                    onChange={(e) => setCascadeForm((f) => ({ ...f, postalCode: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCascadingModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="kpi-gradient-blue text-white">
                  Create & Save Hierarchy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL: CATEGORY CREATE/EDIT ─────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-600 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  {editingItem ? "Edit Product Category" : "Add Product Category"}
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Category Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Fabrics, Silk & Georgette, Buttons & Zippers"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Parent Category (Optional - for Subcategories)
                </label>
                <select
                  value={categoryForm.parentId}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, parentId: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">-- None (Main / Root Category) --</option>
                  {categories
                    .filter((c) => !editingItem || c.id !== editingItem.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes about fabric types, rolls, or products in this category..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="categoryIsActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <label htmlFor="categoryIsActive" className="text-xs font-medium text-foreground">
                  Active in Catalog & Billing POS
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="kpi-gradient-purple text-white">
                  {editingItem ? "Update Category" : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL: DIRECT AREA MODAL ─────────────────── */}
      {showAreaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-bold text-base text-foreground">
                {editingItem ? "Edit Area" : "Add Area"}
              </h3>
              <button
                onClick={() => setShowAreaModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!areaForm.name.trim() || !areaForm.districtId) {
                  toast.error("Area name and district are required");
                  return;
                }
                try {
                  setSaving(true);
                  const url = "/api/configuration/geo/areas";
                  const method = editingItem ? "PUT" : "POST";
                  const payload = {
                    ...(editingItem ? { id: editingItem.id } : {}),
                    districtId: areaForm.districtId,
                    name: areaForm.name.trim(),
                    postalCode: areaForm.postalCode.trim() || null,
                    isActive: areaForm.isActive,
                  };

                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Failed to save area");

                  toast.success(editingItem ? "Area updated!" : "Area created!");
                  setShowAreaModal(false);
                  setEditingItem(null);
                  fetchAllData();
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-4 pt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  District <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={areaForm.districtId}
                  onChange={(e) => setAreaForm((f) => ({ ...f, districtId: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">-- Select District --</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.division?.name || "Division"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Area Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanmondi, Gulshan, Uttara"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1209"
                  value={areaForm.postalCode}
                  onChange={(e) => setAreaForm((f) => ({ ...f, postalCode: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="areaIsActive"
                  checked={areaForm.isActive}
                  onChange={(e) => setAreaForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <label htmlFor="areaIsActive" className="text-xs font-medium text-foreground">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAreaModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="kpi-gradient-blue text-white">
                  {editingItem ? "Update Area" : "Save Area"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL: DIRECT COUNTRY MODAL ─────────────────── */}
      {showCountryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-bold text-base text-foreground">
                {editingItem ? "Edit Country" : "Add Country"}
              </h3>
              <button
                onClick={() => setShowCountryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!countryForm.name.trim()) {
                  toast.error("Country name is required");
                  return;
                }
                try {
                  setSaving(true);
                  const url = "/api/configuration/geo/countries";
                  const method = editingItem ? "PUT" : "POST";
                  const payload = {
                    ...(editingItem ? { id: editingItem.id } : {}),
                    name: countryForm.name.trim(),
                    code: countryForm.code.trim().toUpperCase() || null,
                    phoneCode: countryForm.phoneCode.trim() || null,
                    currency: countryForm.currency.trim().toUpperCase() || "BDT",
                    isActive: countryForm.isActive,
                  };

                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Failed to save country");

                  toast.success(editingItem ? "Country updated!" : "Country created!");
                  setShowCountryModal(false);
                  setEditingItem(null);
                  fetchAllData();
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-4 pt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Country Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangladesh"
                  value={countryForm.name}
                  onChange={(e) => setCountryForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    ISO Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BD"
                    value={countryForm.code}
                    onChange={(e) => setCountryForm((f) => ({ ...f, code: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Phone Dial Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +880"
                    value={countryForm.phoneCode}
                    onChange={(e) => setCountryForm((f) => ({ ...f, phoneCode: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Default Currency
                </label>
                <input
                  type="text"
                  placeholder="e.g. BDT"
                  value={countryForm.currency}
                  onChange={(e) => setCountryForm((f) => ({ ...f, currency: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="countryIsActive"
                  checked={countryForm.isActive}
                  onChange={(e) => setCountryForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <label htmlFor="countryIsActive" className="text-xs font-medium text-foreground">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCountryModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="kpi-gradient-blue text-white">
                  {editingItem ? "Update Country" : "Save Country"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL: DIRECT DIVISION MODAL ─────────────────── */}
      {showDivisionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-bold text-base text-foreground">
                {editingItem ? "Edit Division" : "Add Division"}
              </h3>
              <button
                onClick={() => setShowDivisionModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!divisionForm.name.trim() || !divisionForm.countryId) {
                  toast.error("Division name and country are required");
                  return;
                }
                try {
                  setSaving(true);
                  const url = "/api/configuration/geo/divisions";
                  const method = editingItem ? "PUT" : "POST";
                  const payload = {
                    ...(editingItem ? { id: editingItem.id } : {}),
                    countryId: divisionForm.countryId,
                    name: divisionForm.name.trim(),
                    code: divisionForm.code.trim().toUpperCase() || null,
                    isActive: divisionForm.isActive,
                  };

                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Failed to save division");

                  toast.success(editingItem ? "Division updated!" : "Division created!");
                  setShowDivisionModal(false);
                  setEditingItem(null);
                  fetchAllData();
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-4 pt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Country <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={divisionForm.countryId}
                  onChange={(e) => setDivisionForm((f) => ({ ...f, countryId: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">-- Select Country --</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Division Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka, Chittagong, Sylhet"
                  value={divisionForm.name}
                  onChange={(e) => setDivisionForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHA, CTG"
                  value={divisionForm.code}
                  onChange={(e) => setDivisionForm((f) => ({ ...f, code: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="divIsActive"
                  checked={divisionForm.isActive}
                  onChange={(e) => setDivisionForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <label htmlFor="divIsActive" className="text-xs font-medium text-foreground">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDivisionModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="kpi-gradient-blue text-white">
                  {editingItem ? "Update Division" : "Save Division"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL: DIRECT DISTRICT MODAL ─────────────────── */}
      {showDistrictModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-bold text-base text-foreground">
                {editingItem ? "Edit District" : "Add District"}
              </h3>
              <button
                onClick={() => setShowDistrictModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!districtForm.name.trim() || !districtForm.divisionId) {
                  toast.error("District name and division are required");
                  return;
                }
                try {
                  setSaving(true);
                  const url = "/api/configuration/geo/districts";
                  const method = editingItem ? "PUT" : "POST";
                  const payload = {
                    ...(editingItem ? { id: editingItem.id } : {}),
                    divisionId: districtForm.divisionId,
                    name: districtForm.name.trim(),
                    code: districtForm.code.trim().toUpperCase() || null,
                    isActive: districtForm.isActive,
                  };

                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Failed to save district");

                  toast.success(editingItem ? "District updated!" : "District created!");
                  setShowDistrictModal(false);
                  setEditingItem(null);
                  fetchAllData();
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-4 pt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Division <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={districtForm.divisionId}
                  onChange={(e) => setDistrictForm((f) => ({ ...f, divisionId: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">-- Select Division --</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.country?.name || "Country"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  District Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka, Gazipur, Narayanganj"
                  value={districtForm.name}
                  onChange={(e) => setDistrictForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHK, GAZ"
                  value={districtForm.code}
                  onChange={(e) => setDistrictForm((f) => ({ ...f, code: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="distIsActive"
                  checked={districtForm.isActive}
                  onChange={(e) => setDistrictForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <label htmlFor="distIsActive" className="text-xs font-medium text-foreground">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDistrictModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="kpi-gradient-blue text-white">
                  {editingItem ? "Update District" : "Save District"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
