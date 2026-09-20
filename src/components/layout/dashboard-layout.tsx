"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Topbar, Breadcrumbs } from "./topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {mobileOpen && (
        <div className="lg:hidden fixed left-0 top-0 h-full z-40">
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Topbar */}
      <Topbar
        onSidebarToggle={() => setMobileOpen(!mobileOpen)}
        user={user}
        sidebarCollapsed={collapsed}
      />

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen transition-sidebar",
          "pt-[60px]",
          "lg:pl-[260px]",
          collapsed && "lg:pl-[68px]"
        )}
      >
        <div className="p-5 lg:p-6">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
