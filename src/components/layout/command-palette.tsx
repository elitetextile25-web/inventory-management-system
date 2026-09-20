"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Scissors,
  Package,
  Layers,
  ShoppingBag,
  ShoppingCart,
  Users,
  Building2,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Shield,
  Plus,
  ArrowRight,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Quick Actions" | "Fabrics & Products";
  icon: any;
  href: string;
  badge?: string;
}

const STATIC_ITEMS: SearchItem[] = [
  // Quick Actions
  {
    id: "action-pos",
    title: "Open POS Cutting Register",
    subtitle: "Quick fabric meter cutting and retail checkout",
    category: "Quick Actions",
    icon: Scissors,
    href: "/pos",
    badge: "Sale",
  },
  {
    id: "action-new-product",
    title: "Add New Fabric / Product",
    subtitle: "Create a new fabric roll or textile item",
    category: "Quick Actions",
    icon: Plus,
    href: "/products",
    badge: "Inventory",
  },
  {
    id: "action-purchase",
    title: "Create Purchase Order",
    subtitle: "Order fabrics & rolls from suppliers",
    category: "Quick Actions",
    icon: ShoppingBag,
    href: "/purchases",
    badge: "Stock In",
  },
  {
    id: "action-sheets",
    title: "Sync with Google Sheets",
    subtitle: "Cloud backup and 15GB Google Drive sync",
    category: "Quick Actions",
    icon: FileSpreadsheet,
    href: "/settings/google-sheets",
    badge: "Cloud",
  },

  // Navigation
  {
    id: "nav-dashboard",
    title: "Dashboard Overview",
    subtitle: "Daily sales, revenue, alerts & KPIs",
    category: "Navigation",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "nav-products",
    title: "Fabrics & Products Catalog",
    subtitle: "Manage fabric types, GSM, colors, prices",
    category: "Navigation",
    icon: Layers,
    href: "/products",
  },
  {
    id: "nav-inventory",
    title: "Inventory & Stock Rolls",
    subtitle: "Track meters, roll balances, stock adjustments",
    category: "Navigation",
    icon: Package,
    href: "/inventory",
  },
  {
    id: "nav-pos",
    title: "POS Billing System",
    subtitle: "Point of Sale counter billing",
    category: "Navigation",
    icon: Scissors,
    href: "/pos",
  },
  {
    id: "nav-sales",
    title: "Sales & Invoices",
    subtitle: "Customer invoices, payments, receipts",
    category: "Navigation",
    icon: ShoppingCart,
    href: "/sales",
  },
  {
    id: "nav-purchases",
    title: "Purchases & Supplier Orders",
    subtitle: "Purchase orders, fabric receipts",
    category: "Navigation",
    icon: ShoppingBag,
    href: "/purchases",
  },
  {
    id: "nav-customers",
    title: "Customers Directory",
    subtitle: "Client profiles, credit limits, purchase history",
    category: "Navigation",
    icon: Users,
    href: "/customers",
  },
  {
    id: "nav-suppliers",
    title: "Fabric Suppliers & Mills",
    subtitle: "Mill vendors, fabric suppliers, ledgers",
    category: "Navigation",
    icon: Building2,
    href: "/suppliers",
  },
  {
    id: "nav-reports",
    title: "Reports & Analytics",
    subtitle: "Sales breakdown, stock valuation, profits",
    category: "Navigation",
    icon: BarChart3,
    href: "/reports",
  },
  {
    id: "nav-audit",
    title: "Audit & Activity Logs",
    subtitle: "System security & user activity trail",
    category: "Navigation",
    icon: Shield,
    href: "/audit",
  },
  {
    id: "nav-settings",
    title: "Settings & Configuration",
    subtitle: "Store setup, taxes, units, print templates",
    category: "Navigation",
    icon: Settings,
    href: "/settings",
  },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [dbProducts, setDbProducts] = React.useState<SearchItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Focus on open & reset
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setDbProducts([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Live product search
  React.useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setDbProducts([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const items: SearchItem[] = json.data.slice(0, 6).map((p: any) => ({
            id: `prod-${p.id}`,
            title: p.name,
            subtitle: `SKU: ${p.sku} · ৳${Number(p.sellingPrice).toLocaleString()} / ${p.unit?.abbreviation || "unit"} · ${p.category?.name || "Fabric"}`,
            category: "Fabrics & Products",
            icon: Layers,
            href: `/products?search=${encodeURIComponent(p.sku)}`,
            badge: "Product",
          }));
          setDbProducts(items);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter static items
  const filteredStatic = React.useMemo(() => {
    if (!query.trim()) return STATIC_ITEMS;
    const q = query.toLowerCase();
    return STATIC_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  // All combined items
  const allItems = React.useMemo(() => {
    return [...dbProducts, ...filteredStatic];
  }, [dbProducts, filteredStatic]);

  // Group items by category
  const grouped = React.useMemo(() => {
    const groups: { [key: string]: SearchItem[] } = {};
    for (const item of allItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [allItems]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, allItems, selectedIndex, router, onClose]);

  // Scroll active item into view
  React.useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop with deep blur */}
      <div
        className="fixed inset-0 glass-backdrop transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Dialog with deep blur glassmorphism */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl glass-modal transition-all animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Box */}
        <div className="relative flex items-center border-b border-border px-4 py-3.5">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search fabrics, rolls, invoices, or jump to page..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none"
          />
          {loading && (
            <Loader2 className="w-4 h-4 text-primary animate-spin mr-2 shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted mr-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/40"
        >
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-foreground">No matches found</p>
              <p className="text-xs text-muted-foreground mt-1">
                No fabrics, rolls, or pages matched &quot;{query}&quot;
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="py-1.5 first:pt-0 last:pb-0">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const currentIndex = flatIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        data-index={currentIndex}
                        onClick={() => {
                          router.push(item.href);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              isSelected
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p
                                className={cn(
                                  "text-xs truncate mt-0.5",
                                  isSelected
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                )}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-semibold rounded-full",
                                isSelected
                                  ? "bg-primary-foreground/25 text-primary-foreground"
                                  : "bg-muted text-muted-foreground border border-border"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ArrowRight
                            className={cn(
                              "w-4 h-4",
                              isSelected
                                ? "text-primary-foreground"
                                : "text-muted-foreground/50"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-border bg-muted/40 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
              ESC
            </kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
