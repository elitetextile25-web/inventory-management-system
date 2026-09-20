"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Users, Truck,
  RotateCcw, Wallet, TrendingUp, Settings, FileText, BarChart2,
  ChevronLeft, ChevronRight, Store, LogOut, Bell, HelpCircle,
  ClipboardList, DollarSign, Activity, Layers
} from "lucide-react";
import { Scissors, FileSpreadsheet } from "@/components/ui/fabric-icons";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Fabric & Stock",
    items: [
      { label: "Fabrics Catalog", href: "/products", icon: Scissors },
      { label: "Fabric Stock & Rolls", href: "/inventory", icon: Layers },
      { label: "Stock Adjustments", href: "/inventory/adjustments", icon: ClipboardList },
    ],
  },
  {
    group: "Transactions",
    items: [
      { label: "Mill Purchases", href: "/purchases", icon: ShoppingCart },
      { label: "Fabric Sales", href: "/sales", icon: Receipt },
      { label: "Cutting POS", href: "/pos", icon: Store },
      { label: "Returns", href: "/returns", icon: RotateCcw },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Expenses", href: "/expenses", icon: Wallet },
      { label: "Payments", href: "/payments", icon: DollarSign },
      { label: "Cash Register", href: "/payments/cash", icon: FileText },
    ],
  },
  {
    group: "Parties",
    items: [
      { label: "Boutiques & Tailors", href: "/customers", icon: Users },
      { label: "Textile Mills & Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    group: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart2 },
      { label: "Profit & Loss", href: "/reports/profit-loss", icon: TrendingUp },
      { label: "Audit Log", href: "/audit", icon: Activity },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Google Sheets Sync", href: "/settings/google-sheets", icon: FileSpreadsheet },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col bg-card border-r border-border transition-sidebar",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-[60px] border-b border-border px-4 shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg kpi-gradient-purple flex items-center justify-center shadow-sm">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">FabricPro</p>
              <p className="text-[10px] text-muted-foreground leading-tight font-medium">Textile & Fabric ERP</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg kpi-gradient-purple flex items-center justify-center shadow-sm">
            <Scissors className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map((group) => (
          <div key={group.group} className="mb-1">
            {!collapsed && (
              <p className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.group}
              </p>
            )}
            {collapsed && <div className="h-2" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                    "hover:bg-muted",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-border p-2 space-y-1", collapsed && "px-1")}>
        <button
          className={cn(
            "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all duration-150",
            collapsed && "justify-center px-2"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle (when collapsed) */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hidden lg:flex"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </aside>
  );
}
