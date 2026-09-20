-- =============================================================================
-- INVENTORY & SHOP MANAGEMENT SYSTEM (INVENTORYPRO)
-- Initial Seed Data Script (PostgreSQL)
-- =============================================================================

-- 1. Default Organization
INSERT INTO "organizations" ("id", "name", "address", "phone", "email", "website", "currency", "timezone", "locale", "taxNumber")
VALUES (
    'org_default',
    'Metro Retail & Distribution Ltd.',
    'House 45, Road 11, Banani, Dhaka-1213',
    '+880 1711 000000',
    'info@metroretail.com',
    'https://metroretail.com',
    'BDT',
    'Asia/Dhaka',
    'en-BD',
    'TIN-9876543210'
) ON CONFLICT ("id") DO NOTHING;

-- 2. Default Store
INSERT INTO "stores" ("id", "organizationId", "name", "address", "phone", "email", "isDefault", "isActive")
VALUES (
    'store_default',
    'org_default',
    'Dhaka Flagship Store',
    'Gulshan-1 Circle, Dhaka',
    '+880 1811 111111',
    'gulshan@metroretail.com',
    true,
    true
) ON CONFLICT ("id") DO NOTHING;

-- 3. Roles
INSERT INTO "roles" ("id", "organizationId", "name", "description", "isSystem")
VALUES 
    ('role_admin', 'org_default', 'Owner / Admin', 'Full system access to all store operations, finance, and settings', true),
    ('role_manager', 'org_default', 'Store Manager', 'Manage inventory, purchases, sales, and generate reports', true),
    ('role_cashier', 'org_default', 'Cashier', 'POS billing, sales receipts, customer lookup', true)
ON CONFLICT ("organizationId", "name") DO NOTHING;

-- 4. Users (Password is bcrypt for 'Admin123!' -> $2b$10$wN9QjZ1nOQoH8Q1z9z5.IOGj1aZJ8R2R0V4Q6P8H8H8H8H8H8H8H8 or demo)
INSERT INTO "users" ("id", "organizationId", "name", "email", "passwordHash", "isActive")
VALUES (
    'user_admin',
    'org_default',
    'Khairul Amin (Super Admin)',
    'admin@inventory.com',
    '$2a$10$Pek8a9y1J1fD.E0Z4f67..nZgYqfT2FmJ5s0j2.R1g1U9e9h9h9h9',
    true
) ON CONFLICT ("organizationId", "email") DO NOTHING;

INSERT INTO "user_roles" ("userId", "roleId")
VALUES ('user_admin', 'role_admin')
ON CONFLICT ("userId", "roleId") DO NOTHING;

INSERT INTO "user_stores" ("userId", "storeId")
VALUES ('user_admin', 'store_default')
ON CONFLICT ("userId", "storeId") DO NOTHING;

-- 5. Units
INSERT INTO "units" ("id", "organizationId", "name", "abbreviation")
VALUES 
    ('unit_pcs', 'org_default', 'Pieces', 'Pcs'),
    ('unit_kg', 'org_default', 'Kilogram', 'Kg'),
    ('unit_box', 'org_default', 'Box', 'Box'),
    ('unit_ltr', 'org_default', 'Liter', 'Ltr')
ON CONFLICT ("organizationId", "name") DO NOTHING;

-- 6. Categories
INSERT INTO "categories" ("id", "organizationId", "name", "description")
VALUES 
    ('cat_bev', 'org_default', 'Beverages & Dairy', 'Soft drinks, milk, juices, tea, coffee'),
    ('cat_snk', 'org_default', 'Packaged Snacks', 'Biscuits, chips, noodles, confectionery'),
    ('cat_gro', 'org_default', 'Cooking & Staples', 'Rice, oil, spices, flour, sugar'),
    ('cat_per', 'org_default', 'Personal Care', 'Soaps, shampoos, skincare, oral care'),
    ('cat_ele', 'org_default', 'Electronics & Accessories', 'Cables, chargers, earphones, gadgets')
ON CONFLICT ("organizationId", "name") DO NOTHING;

-- 7. Brands
INSERT INTO "brands" ("id", "organizationId", "name")
VALUES 
    ('brd_nes', 'org_default', 'Nestlé'),
    ('brd_prn', 'org_default', 'Pran-RFL'),
    ('brd_uni', 'org_default', 'Unilever'),
    ('brd_sqr', 'org_default', 'Square Consumer'),
    ('brd_sam', 'org_default', 'Samsung')
ON CONFLICT ("organizationId", "name") DO NOTHING;

-- 8. Products
INSERT INTO "products" ("id", "organizationId", "sku", "name", "categoryId", "brandId", "unitId", "purchaseCost", "sellingPrice", "minimumStock", "reorderLevel", "isTaxable", "taxRate")
VALUES 
    ('prd_001', 'org_default', 'PRD-NES-001', 'Nescafé Classic Instant Coffee 200g Jar', 'cat_bev', 'brd_nes', 'unit_pcs', 620.00, 780.00, 20, 40, true, 5.0),
    ('prd_002', 'org_default', 'PRD-NES-002', 'Maggi 2-Minute Masala Noodles (8-Pack)', 'cat_snk', 'brd_nes', 'unit_box', 160.00, 210.00, 30, 60, true, 5.0),
    ('prd_003', 'org_default', 'PRD-PRN-001', 'Pran Frooto Mango Fruit Juice 1L', 'cat_bev', 'brd_prn', 'unit_pcs', 75.00, 95.00, 25, 50, true, 5.0),
    ('prd_004', 'org_default', 'PRD-SQR-001', 'Radhuni Pure Soybean Oil 5L Bottle', 'cat_gro', 'brd_sqr', 'unit_pcs', 860.00, 945.00, 15, 30, true, 5.0),
    ('prd_005', 'org_default', 'PRD-UNI-001', 'Dove Deep Moisture Beauty Bathing Bar 100g', 'cat_per', 'brd_uni', 'unit_pcs', 110.00, 145.00, 40, 80, true, 5.0),
    ('prd_006', 'org_default', 'PRD-SAM-001', 'Samsung 25W USB-C Fast Wall Charger', 'cat_ele', 'brd_sam', 'unit_pcs', 1250.00, 1750.00, 10, 20, true, 5.0)
ON CONFLICT ("organizationId", "sku") DO NOTHING;

-- 9. Inventory Balances
INSERT INTO "inventory_balances" ("id", "storeId", "productId", "quantity", "averageCost")
VALUES 
    ('ib_001', 'store_default', 'prd_001', 65, 620.00),
    ('ib_002', 'store_default', 'prd_002', 120, 160.00),
    ('ib_003', 'store_default', 'prd_003', 85, 75.00),
    ('ib_004', 'store_default', 'prd_004', 42, 860.00),
    ('ib_005', 'store_default', 'prd_005', 110, 110.00),
    ('ib_006', 'store_default', 'prd_006', 8, 1250.00)
ON CONFLICT ("storeId", "productId") DO NOTHING;

-- 10. Customers & Suppliers
INSERT INTO "customers" ("id", "organizationId", "name", "phone", "email", "address", "creditLimit")
VALUES 
    ('cust_001', 'org_default', 'Rafiqul Islam', '+880 1712 345678', 'rafiq@gmail.com', 'House 12, Road 4, Sector 7, Uttara, Dhaka', 25000),
    ('cust_002', 'org_default', 'Farhana Yasmin', '+880 1819 876543', 'farhana.y@outlook.com', 'Mirpur DOHS, Avenue 3, Dhaka', 15000)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "suppliers" ("id", "organizationId", "name", "phone", "email", "address", "creditLimit", "paymentTerms")
VALUES 
    ('supp_001', 'org_default', 'National Distributors Co.', '+880 1911 223344', 'orders@nationaldist.com', 'Tejgaon Industrial Area, Dhaka', 500000, 30)
ON CONFLICT ("id") DO NOTHING;

-- 11. Cash Accounts
INSERT INTO "cash_accounts" ("id", "storeId", "name", "type", "openingBalance", "currentBalance", "isDefault", "isActive")
VALUES 
    ('cash_main', 'store_default', 'Main POS Register 1', 'CASH', 5000.00, 24500.00, true, true)
ON CONFLICT ("id") DO NOTHING;

-- 12. Expense Categories
INSERT INTO "expense_categories" ("id", "organizationId", "name")
VALUES 
    ('exp_rent', 'org_default', 'Shop Rent'),
    ('exp_sal', 'org_default', 'Staff Salaries'),
    ('exp_ele', 'org_default', 'Electricity & Utilities'),
    ('exp_pkg', 'org_default', 'Packaging & Bags'),
    ('exp_log', 'org_default', 'Logistics & Delivery')
ON CONFLICT ("organizationId", "name") DO NOTHING;
