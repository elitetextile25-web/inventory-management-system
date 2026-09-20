const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating database to Fabric Shop data...");

  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    console.log(`Processing org: ${org.name} (${org.id})`);

    // 1. Update Org name if it is the default old name
    if (org.name === "Metro Retail & Distribution Ltd." || org.name.includes("Metro Retail")) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          name: "EliteTex Fabric & Textile Mills",
          address: "Shop 12-14, Islamia Market, Baburhat, Narsingdi & Gulshan-1, Dhaka",
          email: "info@elitetexfabrics.com",
          website: "https://elitetexfabrics.com",
        },
      });
      console.log("Updated organization name to EliteTex Fabric & Textile Mills");
    }

    // 2. Units (Meters, Yards, Rolls, Bolts, Pieces, Kilogram)
    const unitsData = [
      { name: "Meter", abbreviation: "m" },
      { name: "Yard", abbreviation: "yd" },
      { name: "Roll", abbreviation: "roll" },
      { name: "Bolt / Thaan", abbreviation: "thn" },
      { name: "Piece", abbreviation: "pcs" },
      { name: "Kilogram", abbreviation: "kg" },
    ];

    const unitMap = {};
    for (const u of unitsData) {
      const unit = await prisma.unit.upsert({
        where: { organizationId_name: { organizationId: org.id, name: u.name } },
        update: { abbreviation: u.abbreviation },
        create: { organizationId: org.id, name: u.name, abbreviation: u.abbreviation },
      });
      unitMap[u.name] = unit;
      unitMap[u.abbreviation] = unit;
    }

    // 3. Fabric Categories
    const categoriesData = [
      { name: "Pure Cotton & Lawn", description: "100% Egyptian Giza, Voile, Poplin, Printed Lawn" },
      { name: "Silk & Chiffon", description: "Mulberry Silk, Habotai, Raw Silk, Digital Chiffon, Georgette" },
      { name: "Linen & Chambray", description: "Pure Belgian Linen, Flax, Yarn Dyed Chambray" },
      { name: "Denim & Twill", description: "10oz-14.5oz Indigo Denim, Bull Denim, Stretch Twill" },
      { name: "Velvet & Satin", description: "Micro Velvet, Silk Satin, Duchess Heavy Satin" },
      { name: "Brocade & Zari", description: "Banarasi Silk Brocade, Jacquard, Jamdani Weave" },
    ];

    const catMap = {};
    for (const c of categoriesData) {
      const cat = await prisma.category.upsert({
        where: { organizationId_name: { organizationId: org.id, name: c.name } },
        update: { description: c.description },
        create: { organizationId: org.id, name: c.name, description: c.description },
      });
      catMap[c.name] = cat;
    }

    // 4. Textile Mills & Brands
    const brandsData = [
      "Arvind Mills Ltd.",
      "Raymond Fine Fabrics",
      "Apex Weaving & Dyeing",
      "Beximco Textiles",
      "Royal Silk Weavers",
      "Gul Ahmed Textiles",
      "Nishat Linen Mills",
    ];

    const brandMap = {};
    for (const b of brandsData) {
      const brand = await prisma.brand.upsert({
        where: { organizationId_name: { organizationId: org.id, name: b } },
        update: {},
        create: { organizationId: org.id, name: b },
      });
      brandMap[b] = brand;
    }

    // 5. Fabric Products
    const fabricProducts = [
      {
        sku: "FAB-COT-001",
        name: "Pure Egyptian Giza Cotton 60s (White)",
        category: "Pure Cotton & Lawn",
        brand: "Arvind Mills Ltd.",
        unit: "m",
        cost: 290,
        price: 420,
        minStock: 50,
        stock: 185.5,
        description: "100% Giza Cotton, 60s count, 58 inch width, suitable for panjabi, shirts, and luxury kurtas.",
      },
      {
        sku: "FAB-COT-002",
        name: "Premium Cotton Lawn Floral Print 54\"",
        category: "Pure Cotton & Lawn",
        brand: "Gul Ahmed Textiles",
        unit: "m",
        cost: 220,
        price: 340,
        minStock: 40,
        stock: 120.0,
        description: "Lightweight breathable cotton lawn with reactive digital floral print.",
      },
      {
        sku: "FAB-SLK-001",
        name: "100% Mulberry Raw Silk Habotai 44\"",
        category: "Silk & Chiffon",
        brand: "Royal Silk Weavers",
        unit: "m",
        cost: 980,
        price: 1450,
        minStock: 20,
        stock: 48.0,
        description: "Pure mulberry raw silk, natural sheen, perfect for bridal wear and luxury evening gowns.",
      },
      {
        sku: "FAB-LIN-001",
        name: "Pure Belgian Linen Chambray 60\"",
        category: "Linen & Chambray",
        brand: "Raymond Fine Fabrics",
        unit: "m",
        cost: 620,
        price: 880,
        minStock: 30,
        stock: 95.0,
        description: "100% natural European flax linen, yarn-dyed sky blue chambray weave.",
      },
      {
        sku: "FAB-DNM-001",
        name: "Heavy Indigo Denim 14.5oz Twill 58\"",
        category: "Denim & Twill",
        brand: "Beximco Textiles",
        unit: "m",
        cost: 440,
        price: 650,
        minStock: 35,
        stock: 140.0,
        description: "Rigid dark indigo denim fabric, 14.5oz weight, ideal for jackets and premium jeans.",
      },
      {
        sku: "FAB-CHF-001",
        name: "Floral Digital Print Chiffon 58\"",
        category: "Silk & Chiffon",
        brand: "Nishat Linen Mills",
        unit: "m",
        cost: 350,
        price: 520,
        minStock: 25,
        stock: 115.5,
        description: "Soft flowing chiffon fabric with pastel botanical print, width 58 inches.",
      },
      {
        sku: "FAB-VLV-001",
        name: "Royal Micro Velvet 58\" (Royal Navy)",
        category: "Velvet & Satin",
        brand: "Apex Weaving & Dyeing",
        unit: "m",
        cost: 750,
        price: 1100,
        minStock: 20,
        stock: 65.0,
        description: "High density 9000 micro velvet, deep royal navy color, excellent drape.",
      },
      {
        sku: "FAB-BRC-001",
        name: "Banarasi Zari Silk Brocade 44\" (Antique Gold)",
        category: "Brocade & Zari",
        brand: "Royal Silk Weavers",
        unit: "m",
        cost: 1500,
        price: 2200,
        minStock: 15,
        stock: 35.0,
        description: "Intricate metallic gold zari floral weaving on pure silk base.",
      },
    ];

    // Find store for this org
    const store = await prisma.store.findFirst({ where: { organizationId: org.id } });

    for (const p of fabricProducts) {
      const prod = await prisma.product.upsert({
        where: { organizationId_sku: { organizationId: org.id, sku: p.sku } },
        update: {
          name: p.name,
          categoryId: catMap[p.category]?.id,
          brandId: brandMap[p.brand]?.id,
          unitId: unitMap[p.unit]?.id,
          purchaseCost: p.cost,
          sellingPrice: p.price,
          minimumStock: p.minStock,
          description: p.description,
          status: "ACTIVE",
        },
        create: {
          organizationId: org.id,
          sku: p.sku,
          name: p.name,
          categoryId: catMap[p.category]?.id,
          brandId: brandMap[p.brand]?.id,
          unitId: unitMap[p.unit]?.id,
          purchaseCost: p.cost,
          sellingPrice: p.price,
          minimumStock: p.minStock,
          reorderLevel: p.minStock * 2,
          description: p.description,
          status: "ACTIVE",
          isTaxable: true,
          taxRate: 5.0,
        },
      });

      if (store) {
        await prisma.inventoryBalance.upsert({
          where: { storeId_productId: { storeId: store.id, productId: prod.id } },
          update: { quantity: p.stock, averageCost: p.cost },
          create: { storeId: store.id, productId: prod.id, quantity: p.stock, averageCost: p.cost },
        });
      }
    }

    // 6. Textile Mills / Suppliers
    const suppliersData = [
      { name: "Apex Textile & Weaving Mills", phone: "+880 1711 223344", email: "orders@apextextiles.com", address: "Kachpur Industrial Area, Narayanganj" },
      { name: "Royal Silk Dyeing & Mills Ltd.", phone: "+880 1819 556677", email: "sales@royalsilkmills.com", address: "Sopura Silk Zone, Rajshahi" },
      { name: "Beximco Synthetic & Cotton Mills", phone: "+880 1911 889900", email: "fabrics@beximcofs.com", address: "Kashimpur, Gazipur" },
    ];

    for (const s of suppliersData) {
      const existing = await prisma.supplier.findFirst({ where: { organizationId: org.id, name: s.name } });
      if (!existing) {
        await prisma.supplier.create({
          data: { organizationId: org.id, name: s.name, phone: s.phone, email: s.email, address: s.address, creditLimit: 500000, paymentTerms: 30 },
        });
      }
    }

    // 7. Boutiques & Tailors / Customers
    const customersData = [
      { name: "Zara Bridal & Couture Studio", phone: "+880 1712 112233", email: "zarabridal@gmail.com", address: "Banani Road 11, Dhaka" },
      { name: "Master Tailors & Cutters", phone: "+880 1819 334455", email: "mastertailors@outlook.com", address: "Elephant Road, Dhaka" },
      { name: "Elegance Fashion Boutique", phone: "+880 1911 667788", email: "eleganceboutique@gmail.com", address: "Dhanmondi 27, Dhaka" },
    ];

    for (const c of customersData) {
      const existing = await prisma.customer.findFirst({ where: { organizationId: org.id, name: c.name } });
      if (!existing) {
        await prisma.customer.create({
          data: { organizationId: org.id, name: c.name, phone: c.phone, email: c.email, address: c.address, creditLimit: 50000 },
        });
      }
    }

    // Delete old non-fabric grocery products if they exist
    const oldSkus = ["PRD-NES-001", "PRD-NES-002", "PRD-PRN-001", "PRD-SQR-001", "PRD-UNI-001", "PRD-SAM-001"];
    await prisma.inventoryBalance.deleteMany({
      where: { product: { organizationId: org.id, sku: { in: oldSkus } } }
    });
    await prisma.product.deleteMany({
      where: { organizationId: org.id, sku: { in: oldSkus } }
    });
    console.log("Cleaned up old non-fabric demo products.");
  }

  console.log("✅ Fabric Shop data update complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
