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

  // 13. Storage Locations
  const mainWarehouse = await prisma.storageLocation.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "LOC-000001" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Narayanganj Main Warehouse",
      code: "LOC-000001",
      type: "Main Warehouse",
      storeManager: "Tanvir Ahmed",
      contactNumber: "+880 1711 223344",
      email: "warehouse.nrj@metroretail.com",
      capacity: 50000,
      capacityUnit: "Pieces",
      country: "Bangladesh",
      division: "Dhaka",
      district: "Narayanganj",
      upazila: "Narayanganj Sadar",
      area: "Chashara",
      streetRoad: "Station Road, Plot 14",
      buildingName: "Al-Baraka Logistics Center",
      floorNumber: "1st & 2nd Floor",
      fullAddress: "Plot 14, Station Road, Chashara, Narayanganj-1400",
      description: "Primary distribution and storage hub for all fabric imports and bulk stocks",
      status: "ACTIVE",
    },
  });

  const showroom = await prisma.storageLocation.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "LOC-000002" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Dhaka Flagship Showroom",
      code: "LOC-000002",
      type: "Showroom",
      parentWarehouseId: mainWarehouse.id,
      storeManager: "Farhana Yasmin",
      contactNumber: "+880 1811 556677",
      email: "showroom.gulshan@metroretail.com",
      capacity: 5000,
      capacityUnit: "Pieces",
      country: "Bangladesh",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Gulshan",
      area: "Gulshan-1",
      streetRoad: "Road 11, Block D",
      buildingName: "Avenue Tower",
      floorNumber: "Ground Floor",
      fullAddress: "Avenue Tower, Road 11, Gulshan-1, Dhaka-1212",
      description: "Flagship retail showroom and cutting unit",
      status: "ACTIVE",
    },
  });

  const ctgHub = await prisma.storageLocation.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "LOC-000003" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Chittagong Port Distribution Hub",
      code: "LOC-000003",
      type: "Distribution Center",
      storeManager: "Kamal Hossain",
      contactNumber: "+880 1911 889900",
      email: "ctg.hub@metroretail.com",
      capacity: 35000,
      capacityUnit: "Pieces",
      country: "Bangladesh",
      division: "Chittagong",
      district: "Chittagong",
      upazila: "Double Mooring",
      area: "Agrabad C/A",
      streetRoad: "Sheikh Mujib Road",
      buildingName: "Port Commercial Complex",
      floorNumber: "Building B, Ground Floor",
      fullAddress: "Sheikh Mujib Road, Agrabad C/A, Chittagong-4100",
      description: "Direct customs clearance and southern distribution center",
      status: "ACTIVE",
    },
  });

  // 14. Purchase Sources
  const gzFactory = await prisma.purchaseSource.upsert({
    where: { organizationId_sourceCode: { organizationId: org.id, sourceCode: "SRC-000001" } },
    update: {},
    create: {
      organizationId: org.id,
      sourceName: "ABC Clothing Factory",
      sourceCode: "SRC-000001",
      sourceType: "Manufacturer / Factory",
      supplierName: "ABC Garments & Textiles Ltd.",
      contactPerson: "Mr. Chen Wei",
      phoneNumber: "+86 20 8123 4567",
      whatsappNumber: "+86 138 0000 1111",
      emailAddress: "sales@abc-clothing-gz.com",
      website: "https://abc-clothing-gz.com",
      country: "China",
      division: "Guangdong",
      city: "Guangzhou",
      areaStreet: "Panyu Industrial Park, Road 8",
      buildingName: "Building 4, ABC Manufacturing Complex",
      fullAddress: "Building 4, Panyu Industrial Park, Guangzhou, Guangdong, China",
      preferredCurrency: "CNY",
      paymentTerms: "30% Advance, 70% LC upon Bill of Lading",
      supplierNotes: "High-grade combed cotton fabrics and knitwear manufacturing",
      additionalDescription: "Direct manufacturing partner in Guangzhou",
      status: "ACTIVE",
    },
  });

  const islampurWholesale = await prisma.purchaseSource.upsert({
    where: { organizationId_sourceCode: { organizationId: org.id, sourceCode: "SRC-000002" } },
    update: {},
    create: {
      organizationId: org.id,
      sourceName: "Islampur Textile Wholesale Hub",
      sourceCode: "SRC-000002",
      sourceType: "Wholesale Market Stall",
      supplierName: "Bismillah Fabric Traders",
      contactPerson: "Haji Nurul Islam",
      phoneNumber: "+880 1712 345678",
      whatsappNumber: "+880 1712 345678",
      emailAddress: "bismillah.islampur@gmail.com",
      country: "Bangladesh",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Kotwali",
      marketName: "Ahsanullah Cloth Market",
      areaStreet: "Islampur Road",
      buildingName: "Ahsanullah Plaza",
      shopNumber: "Stall #42-43",
      fullAddress: "Stall #42-43, Ahsanullah Plaza, Islampur Road, Kotwali, Dhaka-1100",
      preferredCurrency: "BDT",
      paymentTerms: "Immediate Cash / 15-day Credit",
      supplierNotes: "Local wholesale source for cotton poplin, voile, and linen",
      status: "ACTIVE",
    },
  });

  const suratMills = await prisma.purchaseSource.upsert({
    where: { organizationId_sourceCode: { organizationId: org.id, sourceCode: "SRC-000003" } },
    update: {},
    create: {
      organizationId: org.id,
      sourceName: "Surat Silk & Rayon Mills",
      sourceCode: "SRC-000003",
      sourceType: "Manufacturer / Factory",
      supplierName: "Surat Synthetic Textiles Corp.",
      contactPerson: "Rajesh Patel",
      phoneNumber: "+91 261 234 5678",
      whatsappNumber: "+91 982 500 1234",
      emailAddress: "export@suratsilkmills.in",
      website: "https://suratsilkmills.in",
      country: "India",
      division: "Gujarat",
      city: "Surat",
      areaStreet: "Ring Road Textile Market, Sector 2",
      buildingName: "Mill Compound 12",
      fullAddress: "Plot 12, Ring Road Textile Market, Surat, Gujarat-395002, India",
      preferredCurrency: "USD",
      paymentTerms: "TT / Irrevocable LC at Sight",
      supplierNotes: "Specialist in georgette, chiffon, and jacquard weaving",
      status: "ACTIVE",
    },
  });

  // 15. Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      storeId: store.id,
      actorId: adminUser.id,
      action: "SYSTEM_INITIALIZE",
      entityType: "ORGANIZATION",
      entityId: org.id,
      newValues: { note: "Initialized InventoryPro demo workspace with default catalog, storage locations, purchase sources, users, and stock" },
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
