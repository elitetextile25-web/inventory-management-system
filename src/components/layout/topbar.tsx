"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  Search,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  Store as StoreIcon,
  Menu,
  Check,
  LogOut,
  User as UserIcon,
  Settings,
  Shield,
  CheckCheck,
  AlertTriangle,
  PackageCheck,
  ShoppingBag,
  ExternalLink,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/badge";
import { CommandPalette } from "./command-palette";

interface TopbarProps {
  onSidebarToggle: () => void;
  user?: { name?: string | null; email?: string | null };
  sidebarCollapsed?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "warning" | "success" | "info";
  href: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Low Stock Alert: Cotton Voile 60\"",
    description: "Remaining stock is 12.5m (below reorder level of 30.0m)",
    time: "10m ago",
    read: false,
    type: "warning",
    href: "/inventory",
  },
  {
    id: "notif-2",
    title: "PO-2026-004 Received",
    description: "500m Raymond Fine Suiting received from Arvind Mills Ltd.",
    time: "45m ago",
    read: false,
    type: "success",
    href: "/purchases",
  },
  {
    id: "notif-3",
    title: "New POS Invoice #INV-2026-089",
    description: "Paid in full: ৳18,500 via Cash & bKash",
    time: "2h ago",
    read: false,
    type: "info",
    href: "/sales",
  },
  {
    id: "notif-4",
    title: "Supabase Database Connected",
    description: "PostgreSQL cloud database synchronized",
    time: "4h ago",
    read: true,
    type: "info",
    href: "/settings",
  },
];

interface StoreOption {
  id: string;
  name: string;
  address?: string;
  isDefault?: boolean;
}

const FALLBACK_STORES: StoreOption[] = [
  { id: "store-1", name: "Main Fabric Store", address: "Gulshan-1 Flagship", isDefault: true },
  { id: "store-2", name: "elitetex Main Branch", address: "Dhanmondi Outlet" },
  { id: "store-3", name: "Banani Fabric Warehouse", address: "Road 11 Depot" },
  { id: "store-4", name: "Uttara Showroom", address: "Sector 3 Retail Counter" },
];

export function Topbar({ onSidebarToggle, user, sidebarCollapsed }: TopbarProps) {
  const router = useRouter();

  // Dialog & Dropdown States
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = React.useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  // Theme State
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Store State
  const [stores, setStores] = React.useState<StoreOption[]>(FALLBACK_STORES);
  const [currentStore, setCurrentStore] = React.useState<StoreOption>(FALLBACK_STORES[0]);

  // Notifications State
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  // Refs for outside click handling
  const storeRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const userRef = React.useRef<HTMLDivElement>(null);

  // Initialize theme and store from localStorage & DB
  React.useEffect(() => {
    setMounted(true);

    // Theme initialization
    const isDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("fabricpro_theme") === "dark";
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    // Stores initialization
    const savedStoreName = localStorage.getItem("fabricpro_active_store_name");
    const savedStoreId = localStorage.getItem("fabricpro_active_store_id");

    fetch("/api/stores")
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setStores(json.data);
          if (savedStoreId) {
            const found = json.data.find((s: StoreOption) => s.id === savedStoreId);
            if (found) setCurrentStore(found);
          } else if (savedStoreName) {
            const found = json.data.find((s: StoreOption) => s.name === savedStoreName);
            if (found) setCurrentStore(found);
          } else {
            setCurrentStore(json.data[0]);
          }
        } else if (savedStoreName) {
          const found = FALLBACK_STORES.find((s) => s.name === savedStoreName);
          if (found) setCurrentStore(found);
        }
      })
      .catch(() => {
        if (savedStoreName) {
          const found = FALLBACK_STORES.find((s) => s.name === savedStoreName);
          if (found) setCurrentStore(found);
        }
      });
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle outside clicks to close dropdowns
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) {
        setStoreDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Toggle Theme
  const toggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("fabricpro_theme", "dark");
      toast.success("Switched to Dark Mode", { icon: "🌙" });
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("fabricpro_theme", "light");
      toast.success("Switched to Light Mode", { icon: "☀️" });
    }
  };

  // Switch Store
  const handleSelectStore = (store: StoreOption) => {
    setCurrentStore(store);
    localStorage.setItem("fabricpro_active_store_id", store.id);
    localStorage.setItem("fabricpro_active_store_name", store.name);
    setStoreDropdownOpen(false);
    toast.success(`Active store switched to "${store.name}"`, {
      icon: "🏬",
      description: store.address || "Main retail branch",
    });
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 h-[60px] glass-header flex items-center px-4 gap-3 transition-sidebar",
          sidebarCollapsed ? "lg:left-[68px]" : "lg:left-[260px]",
          "left-0"
        )}
      >
        {/* Mobile menu button */}
        <button
          onClick={onSidebarToggle}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global search button / trigger */}
        <div className="hidden md:flex flex-1 max-w-md">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="w-full h-9 rounded-xl border border-input bg-background/90 hover:bg-muted/60 pl-9 pr-3 text-sm text-left flex items-center justify-between text-muted-foreground transition-all group focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="truncate">Search fabrics, rolls, invoices...</span>
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Mobile search button */}
          <button
            onClick={() => setCommandOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 1. Store Selector Dropdown */}
          <div className="relative hidden sm:block" ref={storeRef}>
            <button
              onClick={() => {
                setStoreDropdownOpen(!storeDropdownOpen);
                setNotifDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 h-9 px-3 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-all",
                storeDropdownOpen && "bg-muted border-primary/40 ring-2 ring-primary/20"
              )}
              aria-label="Select store"
            >
              <StoreIcon className="w-4 h-4 text-primary shrink-0" />
              <span className="max-w-[140px] truncate">{currentStore.name}</span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                  storeDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {storeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-dropdown p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-border mb-1.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Select Store / Branch</p>
                    <p className="text-[11px] text-muted-foreground">Switch active inventory location</p>
                  </div>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
                    {stores.length} Branches
                  </span>
                </div>

                <div className="space-y-1">
                  {stores.map((s) => {
                    const isSelected = s.id === currentStore.id || s.name === currentStore.name;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectStore(s)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <StoreIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{s.name}</p>
                            {s.address && (
                              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 inline" /> {s.address}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-border mt-2 pt-1.5 px-1">
                  <Link
                    href="/settings"
                    onClick={() => setStoreDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span>Store Configuration</span>
                    <Settings className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle dark mode"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mounted && dark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* 3. Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setStoreDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className={cn(
                "relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                notifDropdownOpen && "bg-muted text-foreground"
              )}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-dropdown p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-danger/10 text-danger">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[340px] overflow-y-auto divide-y divide-border/50">
                  {notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                        );
                        setNotifDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors hover:bg-muted group block",
                        !notif.read && "bg-muted/40 font-medium"
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          notif.type === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          notif.type === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          notif.type === "info" && "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        )}
                      >
                        {notif.type === "warning" && <AlertTriangle className="w-3.5 h-3.5" />}
                        {notif.type === "success" && <PackageCheck className="w-3.5 h-3.5" />}
                        {notif.type === "info" && <ShoppingBag className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.description}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-border mt-1 pt-1 px-1 text-center">
                  <Link
                    href="/audit"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="block w-full py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
                  >
                    View Activity in Audit Logs →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 4. User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setStoreDropdownOpen(false);
                setNotifDropdownOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-xl hover:bg-muted transition-colors cursor-pointer text-left focus:outline-none",
                userDropdownOpen && "bg-muted ring-2 ring-primary/20"
              )}
              aria-label="User menu"
            >
              <Avatar name={user?.name ?? "Khairul Amin"} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {user?.name ?? "Khairul Amin"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">
                  {user?.email ?? "admin@inventory.com"}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-3 h-3 text-muted-foreground transition-transform duration-200 hidden sm:block",
                  userDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-dropdown p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                {/* User Header */}
                <div className="p-3 border-b border-border flex items-center gap-3">
                  <Avatar name={user?.name ?? "Khairul Amin"} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {user?.name ?? "Khairul Amin"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {user?.email ?? "admin@inventory.com"}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                      Super Admin
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>System Settings</span>
                  </Link>
                  <Link
                    href="/audit"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>Security & Audit Logs</span>
                  </Link>
                </div>

                <div className="border-t border-border pt-1.5">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Command Palette Modal */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors capitalize">
        Home
      </Link>
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <React.Fragment key={href}>
            <span className="text-muted-foreground/50">/</span>
            {isLast ? (
              <span className="text-foreground font-medium capitalize">
                {seg.replace(/-/g, " ")}
              </span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors capitalize">
                {seg.replace(/-/g, " ")}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
