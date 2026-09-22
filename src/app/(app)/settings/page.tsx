import Link from "next/link";

export const metadata = { title: "Settings — FabricPro" };

export default function SettingsPage() {
  const sections = [
    { label: "Organization", description: "Business name, address, contact info", href: "/settings/organization" },
    { label: "Store", description: "Store settings, timezone, currency", href: "/settings/store" },
    { label: "Users & Roles", description: "Manage users, roles and permissions", href: "/settings/users" },
    { label: "Payment Methods", description: "Configure cash, bank, mobile banking", href: "/settings/payment-methods" },
    { label: "Tax Settings", description: "VAT/tax rates and configuration", href: "/settings/tax" },
    { label: "Expense Categories", description: "Manage expense category list", href: "/settings/expense-categories" },
    { label: "Barcode Settings", description: "Label format, barcode type", href: "/settings/barcodes" },
    { label: "Document Sequences", description: "Invoice, PO number prefixes", href: "/settings/sequences" },
    { label: "Backup & Recovery", description: "Automated backups and restore", href: "/settings/backup" },
    { label: "Audit Log Settings", description: "Log retention and access control", href: "/settings/audit" },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your organization and store configuration</p>
      </div>
      <div className="space-y-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div>
              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
            </div>
            <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

