import Link from "next/link";

export const metadata = { title: "Reports — FabricPro" };

const REPORTS = [
  { name: "Sales Report", href: "/reports/sales", description: "Daily, weekly, monthly sales breakdown", icon: "📊" },
  { name: "Purchase Report", href: "/reports/purchases", description: "Supplier purchases and costs", icon: "🛒" },
  { name: "Inventory Valuation", href: "/reports/inventory-valuation", description: "Current stock value by product", icon: "📦" },
  { name: "Stock Movement", href: "/reports/stock-movement", description: "All stock in/out events", icon: "🔄" },
  { name: "Low Stock Report", href: "/reports/low-stock", description: "Products below minimum stock", icon: "⚠️" },
  { name: "Profit & Loss", href: "/reports/profit-loss", description: "Revenue, COGS, expenses, net profit", icon: "📈" },
  { name: "Expense Report", href: "/reports/expenses", description: "Operating expenses by category", icon: "💸" },
  { name: "Customer Aging", href: "/reports/customer-aging", description: "Receivables aging buckets", icon: "👥" },
  { name: "Supplier Aging", href: "/reports/supplier-aging", description: "Payables aging buckets", icon: "🚛" },
  { name: "Payment Report", href: "/reports/payments", description: "Cash, card, mobile payments", icon: "💳" },
  { name: "Returns & Refunds", href: "/reports/returns", description: "Sale and purchase returns", icon: "↩️" },
  { name: "Cash Register", href: "/reports/cash", description: "Cash account transactions", icon: "💰" },
  { name: "Tax Summary", href: "/reports/tax", description: "Tax collected and paid", icon: "🧾" },
  { name: "Product Sales", href: "/reports/product-sales", description: "Top selling products", icon: "🏆" },
  { name: "Audit Log", href: "/audit", description: "Full audit trail of all actions", icon: "🔍" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">15 report types covering all business operations</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-card transition-all duration-150"
          >
            <span className="text-2xl shrink-0">{r.icon}</span>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{r.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
