"use client";

import * as React from "react";
import {
  Scan, Plus, Minus, Trash2, ReceiptText,
  UserPlus, CreditCard, Banknote, Smartphone, X, Layers,
  CheckCircle2, Sparkles, User, Tag
} from "lucide-react";
import { Scissors } from "@/components/ui/fabric-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ReceiptPrintModal } from "@/components/sales/receipt-print-modal";
import { ReceiptData } from "@/components/sales/thermal-receipt";

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number; // in meters
  unit: string;
  discount: number;
  color?: string;
  width?: string;
}

const FABRIC_CATEGORIES = ["All Fabrics", "Cotton", "Silk", "Linen", "Denim", "Chiffon", "Velvet", "Brocade"];

const DEMO_FABRICS = [
  {
    id: "1",
    name: "Pure Egyptian Giza Cotton 60s",
    sku: "FAB-COT-001",
    price: 420,
    unit: "m",
    width: '58"',
    category: "Cotton",
    color: "#F8F9FA",
    colorName: "Off-White",
    stock: 165.5,
    rolls: 4,
  },
  {
    id: "2",
    name: "Mulberry Raw Silk Habotai",
    sku: "FAB-SLK-002",
    price: 1450,
    unit: "m",
    width: '44"',
    category: "Silk",
    color: "#E2B17B",
    colorName: "Golden Sand",
    stock: 48.0,
    rolls: 2,
  },
  {
    id: "3",
    name: "Pure Belgian Linen Chambray",
    sku: "FAB-LIN-003",
    price: 880,
    unit: "m",
    width: '60"',
    category: "Linen",
    color: "#7BA4B5",
    colorName: "Sky Blue",
    stock: 92.5,
    rolls: 3,
  },
  {
    id: "4",
    name: "Heavy Twill Denim 14.5oz",
    sku: "FAB-DNM-004",
    price: 650,
    unit: "m",
    width: '58"',
    category: "Denim",
    color: "#1B2A4A",
    colorName: "Dark Indigo",
    stock: 140.0,
    rolls: 3,
  },
  {
    id: "5",
    name: "Floral Digital Print Chiffon",
    sku: "FAB-CHF-005",
    price: 520,
    unit: "m",
    width: '54"',
    category: "Chiffon",
    color: "#F48FB1",
    colorName: "Blush Rose",
    stock: 115.0,
    rolls: 3,
  },
  {
    id: "6",
    name: "Royal Micro Velvet 58\"",
    sku: "FAB-VLV-006",
    price: 1100,
    unit: "m",
    width: '58"',
    category: "Velvet",
    color: "#1E3A8A",
    colorName: "Royal Navy",
    stock: 60.0,
    rolls: 2,
  },
  {
    id: "7",
    name: "Banarasi Zari Brocade Silk",
    sku: "FAB-BRC-007",
    price: 2200,
    unit: "m",
    width: '44"',
    category: "Brocade",
    color: "#D97706",
    colorName: "Antique Gold",
    stock: 35.0,
    rolls: 1,
  },
  {
    id: "8",
    name: "Duchess Heavy Satin (Champagne)",
    sku: "FAB-SAT-008",
    price: 780,
    unit: "m",
    width: '58"',
    category: "Silk",
    color: "#FDE68A",
    colorName: "Champagne",
    stock: 82.5,
    rolls: 2,
  },
  {
    id: "9",
    name: "Embroidered Georgette Lace",
    sku: "FAB-GEO-009",
    price: 950,
    unit: "m",
    width: '50"',
    category: "Chiffon",
    color: "#6EE7B7",
    colorName: "Mint Green",
    stock: 55.0,
    rolls: 2,
  },
];

const DEMO_CUSTOMERS = [
  "Walk-in Retail Buyer",
  "Zara Bridal & Couture Studio",
  "Master Tailors & Cutters",
  "Elegance Fashion Boutique",
  "Elite Apparel Studio",
];

export default function POSPage() {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All Fabrics");
  const [selectedCustomer, setSelectedCustomer] = React.useState(DEMO_CUSTOMERS[0]);
  const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false);
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [paid, setPaid] = React.useState("");
  const [completedSale, setCompletedSale] = React.useState<ReceiptData | null>(null);
  const [showPrintModal, setShowPrintModal] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = DEMO_FABRICS.filter((p) => {
    const matchesCategory =
      selectedCategory === "All Fabrics" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.colorName.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (fabric: (typeof DEMO_FABRICS)[0], meters: number = 1.0) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === fabric.id);
      if (existing) {
        return prev.map((i) =>
          i.id === fabric.id
            ? { ...i, quantity: parseFloat((i.quantity + meters).toFixed(2)) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: fabric.id,
          name: fabric.name,
          sku: fabric.sku,
          price: fabric.price,
          quantity: meters,
          unit: fabric.unit,
          discount: 0,
          color: fabric.color,
          width: fabric.width,
        },
      ];
    });
    setSearch("");
    searchRef.current?.focus();
  };

  const updateMeters = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: Math.max(
                  0.25,
                  parseFloat((i.quantity + delta).toFixed(2))
                ),
              }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const setExactMeters = (id: string, meters: number) => {
    if (isNaN(meters) || meters <= 0) return;
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: parseFloat(meters.toFixed(2)) } : i))
    );
  };

  const removeItem = (id: string) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const totalMeters = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce(
    (s, i) => s + (i.price * i.quantity - i.discount),
    0
  );
  const totalDiscount = discount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const paidAmount = Number(paid) || 0;
  const change = paidAmount - grandTotal;

  const handleSale = () => {
    if (cart.length === 0) {
      toast.error("Fabric cut cart is empty");
      return;
    }
    if (paidAmount < grandTotal && paid !== "") {
      toast.error("Insufficient payment amount");
      return;
    }

    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleReceipt: ReceiptData = {
      id: invNum,
      invoiceNumber: invNum,
      saleDate: new Date(),
      status: paidAmount >= grandTotal ? "PAID" : "PARTIALLY_PAID",
      subtotal,
      discountAmount: discount,
      taxAmount: 0,
      grandTotal,
      paidAmount: paidAmount || grandTotal,
      dueAmount: Math.max(0, grandTotal - (paidAmount || grandTotal)),
      channel: "POS",
      customer: { name: selectedCustomer },
      store: { name: "FabricPro Textiles", address: "Main Retail Outlet", phone: "+880 1700-000000" },
      items: cart.map((c) => ({
        id: c.id,
        productName: c.name,
        productSku: c.sku,
        quantity: c.quantity,
        unitPrice: c.price,
        discountAmount: c.discount || 0,
        lineTotal: c.price * c.quantity - (c.discount || 0),
        product: { unit: { abbreviation: c.unit || "m" } },
      })),
      payments: [
        {
          id: "p1",
          method: paymentMethod,
          amount: paidAmount || grandTotal,
          paymentDate: new Date(),
        },
      ],
    };

    setCompletedSale(saleReceipt);
    setShowPrintModal(true);

    toast.success(
      `Fabric sale complete! ${totalMeters.toFixed(2)}m cut for ${selectedCustomer}.`
    );
    setCart([]);
    setPaid("");
    setDiscount(0);
    searchRef.current?.focus();
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-60px-32px)] gap-4 animate-fade-in">
      {/* Left: Fabric Catalog & Cutting Selection */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Fabric Cutting POS
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live roll inventory • Instant cut measurement • Meter & yard billing
            </p>
          </div>

          {/* Customer selection */}
          <div className="relative">
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-card text-xs font-medium hover:border-primary/50 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[180px]">{selectedCustomer}</span>
            </button>

            {showCustomerDropdown && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-border bg-card shadow-xl p-1.5 space-y-1">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Customer / Studio
                </p>
                {DEMO_CUSTOMERS.map((cust) => (
                  <button
                    key={cust}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setShowCustomerDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedCustomer === cust
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>{cust}</span>
                    {selectedCustomer === cust && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search & Barcode Scan */}
        <div className="relative">
          <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Scan fabric roll barcode, search by fabric name, SKU, or shade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-card pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors shadow-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Fabric Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FABRIC_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Fabrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 overflow-y-auto pr-1">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-xs"
                      style={{ backgroundColor: p.color }}
                      title={`Shade: ${p.colorName}`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">
                        {p.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {p.sku} • {p.width}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">
                    {formatCurrency(p.price)}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      /{p.unit}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2 py-1 mb-2.5">
                  <span>
                    Rolls: <strong className="text-foreground">{p.rolls}</strong>
                  </span>
                  <span>
                    Stock:{" "}
                    <strong className="text-foreground">
                      {p.stock.toFixed(1)} {p.unit}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Quick Cut Buttons */}
              <div className="flex items-center gap-1 pt-1 border-t border-border/60">
                <span className="text-[10px] text-muted-foreground mr-1">
                  Cut:
                </span>
                {[1, 2.5, 3.5].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => addToCart(p, preset)}
                    className="flex-1 py-1 text-[11px] font-semibold rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    +{preset}m
                  </button>
                ))}
                <button
                  onClick={() => addToCart(p, 1)}
                  className="px-2 py-1 text-[11px] font-semibold rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
              <Scissors className="w-8 h-8 opacity-30 mb-2" />
              <p>No fabrics match your search filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Cut Measurement */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-3">
        <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-border/80">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-primary" />
                <span>Cutting Cart ({cart.length} items)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {totalMeters.toFixed(2)}m total
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-destructive hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs text-center px-4">
                <Scissors className="w-8 h-8 mb-2 opacity-30 text-primary" />
                <p className="font-medium text-foreground">No fabrics added</p>
                <p className="text-muted-foreground mt-1">
                  Click on fabric cards or use quick-cut buttons (+1m, +2.5m) to add to invoice.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.map((item) => (
                  <div key={item.id} className="p-3 space-y-2 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.color && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatCurrency(item.price)}/{item.unit} • {item.width}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Quantity / Meter Adjustment */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
                        <button
                          onClick={() => updateMeters(item.id, -0.5)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground text-xs"
                          title="-0.5m"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex items-center px-1">
                          <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            value={item.quantity}
                            onChange={(e) =>
                              setExactMeters(item.id, parseFloat(e.target.value))
                            }
                            className="w-14 text-center font-bold text-xs bg-transparent focus:outline-none"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {item.unit}
                          </span>
                        </div>
                        <button
                          onClick={() => updateMeters(item.id, 0.5)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground text-xs"
                          title="+0.5m"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Quick presets for this row */}
                      <div className="flex items-center gap-1">
                        {[1, 2.5].map((m) => (
                          <button
                            key={m}
                            onClick={() => setExactMeters(item.id, m)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {m}m
                          </button>
                        ))}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment & Checkout Card */}
        <Card className="shadow-sm">
          <CardContent className="p-3.5 space-y-3">
            {/* Discount */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Discount</span>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ৳
                </span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full h-7 rounded-lg border border-input bg-card pl-6 pr-2 text-xs text-right font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Fabric Cut</span>
                <span className="font-medium">{totalMeters.toFixed(2)} meters</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive font-medium">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/80">
                <span>Grand Total</span>
                <span className="text-primary text-base font-extrabold">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: "CASH", icon: Banknote, label: "Cash" },
                { id: "CARD", icon: CreditCard, label: "Card / POS" },
                { id: "MOBILE", icon: Smartphone, label: "bKash/Nagad" },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                      paymentMethod === m.id
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Amount Paid */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium w-16">
                Paid:
              </span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ৳
                </span>
                <input
                  type="number"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  placeholder={String(grandTotal)}
                  className="w-full h-8 rounded-lg border border-input bg-card pl-6 pr-2 text-xs text-right font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {paidAmount > grandTotal && (
              <div className="flex justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg">
                <span>Change to Return:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            )}

            {/* Checkout Button */}
            <Button
              className="w-full h-10 text-sm font-semibold shadow-md gap-2"
              onClick={handleSale}
              disabled={cart.length === 0}
            >
              <Scissors className="w-4 h-4" />
              Complete Fabric Cut Sale
            </Button>
          </CardContent>
        </Card>
      </div>

      <ReceiptPrintModal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setCompletedSale(null);
        }}
        initialSale={completedSale}
      />
    </div>
  );
}
