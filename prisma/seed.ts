import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { id: "org_default" },
    update: {},
    create: {
      id: "org_default",
      name: "Metro Retail & Distribution Ltd.",
      address: "House 45, Road 11, Banani, Dhaka-1213",
      phone: "+880 1711 000000",
      email: "info@metroretail.com",
      website: "https://metroretail.com",
      currency: "BDT",
      timezone: "Asia/Dhaka",
      locale: "en-BD",
      taxNumber: "TIN-9876543210",
    },
  });

  // 2. Default Store
  const store = await prisma.store.upsert({
    where: { id: "store_default" },
    update: {},
    create: {
      id: "store_default",
      organizationId: org.id,
      name: "Dhaka Flagship Store",
      address: "Gulshan-1 Circle, Dhaka",
      phone: "+880 1811 111111",
      email: "gulshan@metroretail.com",
      isDefault: true,
      isActive: true,
    },
  });

  // 3. Roles
  const adminRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Owner / Admin" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Owner / Admin",
      description: "Full system access to all store operations, finance, and settings",
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Store Manager" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Store Manager",
      description: "Manage inventory, purchases, sales, and generate reports",
      isSystem: true,
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Cashier" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Cashier",
      description: "POS billing, sales receipts, customer lookup",
      isSystem: true,
    },
  });

  // 4. Default Users
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const adminUser = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@inventory.com" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Khairul Amin (Super Admin)",
      email: "admin@inventory.com",
      passwordHash,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.userStore.upsert({
    where: { userId_storeId: { userId: adminUser.id, storeId: store.id } },
    update: {},
    create: { userId: adminUser.id, storeId: store.id },
  });

  // 5. Units
  const unitsData = [
    { name: "Pieces", abbreviation: "Pcs" },
    { name: "Kilogram", abbreviation: "Kg" },
    { name: "Box", abbreviation: "Box" },
    { name: "Liter", abbreviation: "Ltr" },
  ];

  const units: Record<string, any> = {};
  for (const u of unitsData) {
    units[u.abbreviation] = await prisma.unit.upsert({
      where: { organizationId_name: { organizationId: org.id, name: u.name } },
      update: {},
      create: { organizationId: org.id, name: u.name, abbreviation: u.abbreviation },
    });
  }

  // 6. Categories
  const categoriesData = [
    { name: "Beverages & Dairy", description: "Soft drinks, milk, juices, tea, coffee" },
    { name: "Packaged Snacks", description: "Biscuits, chips, noodles, confectionery" },
    { name: "Cooking & Staples", description: "Rice, oil, spices, flour, sugar" },
    { name: "Personal Care", description: "Soaps, shampoos, skincare, oral care" },
    { name: "Electronics & Accessories", description: "Cables, chargers, earphones, gadgets" },
  ];

  const categories: Record<string, any> = {};
  for (const c of categoriesData) {
    categories[c.name] = await prisma.category.upsert({
      where: { organizationId_name: { organizationId: org.id, name: c.name } },
      update: {},
      create: { organizationId: org.id, name: c.name, description: c.description },
    });
  }

  // 7. Brands
  const brandsData = ["Nestlé", "Pran-RFL", "Unilever", "Square Consumer", "Samsung"];
  const brands: Record<string, any> = {};
  for (const b of brandsData) {
    brands[b] = await prisma.brand.upsert({
      where: { organizationId_name: { organizationId: org.id, name: b } },
      update: {},
      create: { organizationId: org.id, name: b },
    });
  }

  // 8. Products & Stock
  const productsData = [
    {
      sku: "PRD-NES-001",
      name: "Nescafé Classic Instant Coffee 200g Jar",
      category: "Beverages & Dairy",
      brand: "Nestlé",
      unit: "Pcs",
      cost: 620,
      price: 780,
      minStock: 20,
      stock: 65,
    },
    {
      sku: "PRD-NES-002",
      name: "Maggi 2-Minute Masala Noodles (8-Pack)",
      category: "Packaged Snacks",
      brand: "Nestlé",
      unit: "Box",
      cost: 160,
      price: 210,
      minStock: 30,
      stock: 120,
    },
    {
      sku: "PRD-PRN-001",
      name: "Pran Frooto Mango Fruit Juice 1L",
      category: "Beverages & Dairy",
      brand: "Pran-RFL",
      unit: "Pcs",
      cost: 75,
      price: 95,
      minStock: 25,
      stock: 85,
    },
    {
      sku: "PRD-SQR-001",
      name: "Radhuni Pure Soybean Oil 5L Bottle",
      category: "Cooking & Staples",
      brand: "Square Consumer",
      unit: "Pcs",
      cost: 860,
      price: 945,
      minStock: 15,
      stock: 42,
    },
    {
      sku: "PRD-UNI-001",
      name: "Dove Deep Moisture Beauty Bathing Bar 100g",
      category: "Personal Care",
      brand: "Unilever",
      unit: "Pcs",
      cost: 110,
      price: 145,
      minStock: 40,
      stock: 110,
    },
    {
      sku: "PRD-SAM-001",
      name: "Samsung 25W USB-C Fast Wall Charger",
      category: "Electronics & Accessories",
      brand: "Samsung",
      unit: "Pcs",
      cost: 1250,
      price: 1750,
      minStock: 10,
      stock: 8, // Low stock on purpose!
    },
  ];

  for (const p of productsData) {
    const existing = await prisma.product.findFirst({
      where: { organizationId: org.id, sku: p.sku },
    });

    let prodId: string;
    if (existing) {
      prodId = existing.id;
    } else {
      const prod = await prisma.product.create({
        data: {
          organizationId: org.id,
          sku: p.sku,
          name: p.name,
          categoryId: categories[p.category]?.id,
          brandId: brands[p.brand]?.id,
          unitId: units[p.unit]?.id,
          purchaseCost: p.cost,
          sellingPrice: p.price,
          minimumStock: p.minStock,
          reorderLevel: p.minStock * 2,
          isTaxable: true,
          taxRate: 5.0,
        },
      });
      prodId = prod.id;
    }

    // Inventory balance
    await prisma.inventoryBalance.upsert({
      where: { storeId_productId: { storeId: store.id, productId: prodId } },
      update: { quantity: p.stock, averageCost: p.cost },
      create: {
        storeId: store.id,
        productId: prodId,
        quantity: p.stock,
        averageCost: p.cost,
      },
    });
  }

  // 9. Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: "cust_001" },
    update: {},
    create: {
      id: "cust_001",
      organizationId: org.id,
      name: "Rafiqul Islam",
      phone: "+880 1712 345678",
      email: "rafiq@gmail.com",
      address: "House 12, Road 4, Sector 7, Uttara, Dhaka",
      creditLimit: 25000,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: "cust_002" },
    update: {},
    create: {
      id: "cust_002",
      organizationId: org.id,
      name: "Farhana Yasmin",
      phone: "+880 1819 876543",
      email: "farhana.y@outlook.com",
      address: "Mirpur DOHS, Avenue 3, Dhaka",
      creditLimit: 15000,
    },
  });

  // 10. Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { id: "supp_001" },
    update: {},
    create: {
      id: "supp_001",
      organizationId: org.id,
      name: "National Distributors Co.",
      phone: "+880 1911 223344",
      email: "orders@nationaldist.com",
      address: "Tejgaon Industrial Area, Dhaka",
      creditLimit: 500000,
      paymentTerms: 30,
    },
  });

  // 11. Cash Accounts
  await prisma.cashAccount.upsert({
    where: { id: "cash_main" },
    update: {},
    create: {
      id: "cash_main",
      storeId: store.id,
      name: "Main POS Register 1",
      type: "CASH",
      openingBalance: 5000.0,
      currentBalance: 24500.0,
      isDefault: true,
      isActive: true,
    },
  });

  // 12. Expense Categories
  const expenseCats = ["Shop Rent", "Staff Salaries", "Electricity & Utilities", "Packaging & Bags", "Logistics & Delivery"];
  for (const cat of expenseCats) {
    await prisma.expenseCategory.upsert({
      where: { organizationId_name: { organizationId: org.id, name: cat } },
      update: {},
      create: { organizationId: org.id, name: cat },
    });
  }

  // 13. Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      storeId: store.id,
      actorId: adminUser.id,
      action: "SYSTEM_INITIALIZE",
      entityType: "ORGANIZATION",
      entityId: org.id,
      newValues: { note: "Initialized InventoryPro demo workspace with default catalog, users, and stock" },
    },
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
