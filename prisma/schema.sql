-- =============================================================================
-- INVENTORY & SHOP MANAGEMENT SYSTEM (INVENTORYPRO)
-- PostgreSQL Complete Schema Definition
-- =============================================================================

-- Enable CUID/UUID or extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE "UserRoleType" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_STAFF', 'ACCOUNTANT', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_RECEIPT', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'INITIAL_STOCK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AdjustmentStatus" AS ENUM ('DRAFT', 'APPROVED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "StockCountStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "SaleChannel" AS ENUM ('INVOICE', 'POS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'COMPLETED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM ('SALE_PAYMENT', 'PURCHASE_PAYMENT', 'EXPENSE_PAYMENT', 'REFUND', 'OPENING_BALANCE', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK', 'CARD', 'MOBILE_BANKING', 'CHEQUE', 'ACCOUNT_CREDIT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CustomerTxType" AS ENUM ('OPENING_BALANCE', 'SALE', 'SALE_RETURN', 'PAYMENT', 'CREDIT', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "SupplierTxType" AS ENUM ('OPENING_BALANCE', 'PURCHASE', 'PURCHASE_RETURN', 'PAYMENT', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── TABLES ──────────────────────────────────────────────────────────────────

-- 1. Organizations
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "taxNumber" VARCHAR(100),
    "logo" TEXT,
    "currency" VARCHAR(10) DEFAULT 'BDT',
    "timezone" VARCHAR(50) DEFAULT 'Asia/Dhaka',
    "locale" VARCHAR(20) DEFAULT 'en-BD',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Stores
CREATE TABLE IF NOT EXISTS "stores" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "isDefault" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "lastLoginAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_org_email_unique" UNIQUE ("organizationId", "email")
);

-- 4. Roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_org_name_unique" UNIQUE ("organizationId", "name")
);

-- 5. Permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" VARCHAR(64) PRIMARY KEY,
    "code" VARCHAR(100) UNIQUE NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Roles & Stores
CREATE TABLE IF NOT EXISTS "user_roles" (
    "userId" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "roleId" VARCHAR(64) NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    PRIMARY KEY ("userId", "roleId")
);

CREATE TABLE IF NOT EXISTS "user_stores" (
    "userId" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "storeId" VARCHAR(64) NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    PRIMARY KEY ("userId", "storeId")
);

-- 7. Categories, Brands, Units
CREATE TABLE IF NOT EXISTS "categories" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "parentId" VARCHAR(64) REFERENCES "categories"("id") ON DELETE SET NULL,
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_org_name_unique" UNIQUE ("organizationId", "name")
);

CREATE TABLE IF NOT EXISTS "brands" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brands_org_name_unique" UNIQUE ("organizationId", "name")
);

CREATE TABLE IF NOT EXISTS "units" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "abbreviation" VARCHAR(20) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "units_org_name_unique" UNIQUE ("organizationId", "name")
);

-- 8. Products
CREATE TABLE IF NOT EXISTS "products" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "sku" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "categoryId" VARCHAR(64) REFERENCES "categories"("id") ON DELETE SET NULL,
    "brandId" VARCHAR(64) REFERENCES "brands"("id") ON DELETE SET NULL,
    "unitId" VARCHAR(64) REFERENCES "units"("id") ON DELETE SET NULL,
    "purchaseCost" NUMERIC(15, 4) DEFAULT 0 NOT NULL,
    "sellingPrice" NUMERIC(15, 4) DEFAULT 0 NOT NULL,
    "minimumStock" NUMERIC(15, 4) DEFAULT 0 NOT NULL,
    "reorderLevel" NUMERIC(15, 4) DEFAULT 0 NOT NULL,
    "taxRate" NUMERIC(5, 2) DEFAULT 0 NOT NULL,
    "isTaxable" BOOLEAN DEFAULT false,
    "imageUrl" TEXT,
    "status" "ProductStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(64),
    "updatedBy" VARCHAR(64),
    CONSTRAINT "products_org_sku_unique" UNIQUE ("organizationId", "sku")
);

-- 9. Inventory Balances
CREATE TABLE IF NOT EXISTS "inventory_balances" (
    "id" VARCHAR(64) PRIMARY KEY,
    "storeId" VARCHAR(64) NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "quantity" NUMERIC(15, 4) DEFAULT 0 NOT NULL,
    "averageCost" NUMERIC(15, 4) DEFAULT 0 NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inv_store_prod_unique" UNIQUE ("storeId", "productId")
);

-- 10. Customers & Suppliers
CREATE TABLE IF NOT EXISTS "customers" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "creditLimit" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "paymentTerms" INTEGER DEFAULT 0,
    "openingBalance" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "taxNumber" VARCHAR(100),
    "paymentTerms" INTEGER DEFAULT 0,
    "creditLimit" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "openingBalance" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Cash Accounts
CREATE TABLE IF NOT EXISTS "cash_accounts" (
    "id" VARCHAR(64) PRIMARY KEY,
    "storeId" VARCHAR(64) NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) DEFAULT 'CASH',
    "openingBalance" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "currentBalance" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "isDefault" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Purchases
CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" VARCHAR(64) PRIMARY KEY,
    "storeId" VARCHAR(64) NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "supplierId" VARCHAR(64) NOT NULL REFERENCES "suppliers"("id") ON DELETE RESTRICT,
    "orderNumber" VARCHAR(100) NOT NULL,
    "orderDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP WITH TIME ZONE,
    "status" "PurchaseStatus" DEFAULT 'DRAFT',
    "subtotal" NUMERIC(15, 2) NOT NULL,
    "discountAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "taxAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "shippingCost" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "grandTotal" NUMERIC(15, 2) NOT NULL,
    "paidAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "dueAmount" NUMERIC(15, 2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(64),
    CONSTRAINT "purchase_store_order_unique" UNIQUE ("storeId", "orderNumber")
);

-- 13. Sales
CREATE TABLE IF NOT EXISTS "sales" (
    "id" VARCHAR(64) PRIMARY KEY,
    "storeId" VARCHAR(64) NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "customerId" VARCHAR(64) REFERENCES "customers"("id") ON DELETE SET NULL,
    "salespersonId" VARCHAR(64) REFERENCES "users"("id") ON DELETE SET NULL,
    "invoiceNumber" VARCHAR(100) NOT NULL,
    "saleDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "channel" "SaleChannel" DEFAULT 'INVOICE',
    "status" "SaleStatus" DEFAULT 'DRAFT',
    "subtotal" NUMERIC(15, 2) NOT NULL,
    "discountAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "taxAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "grandTotal" NUMERIC(15, 2) NOT NULL,
    "paidAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "dueAmount" NUMERIC(15, 2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(64),
    CONSTRAINT "sales_store_invoice_unique" UNIQUE ("storeId", "invoiceNumber")
);

-- 14. Sale Items
CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" VARCHAR(64) PRIMARY KEY,
    "saleId" VARCHAR(64) NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
    "productName" VARCHAR(255) NOT NULL,
    "productSku" VARCHAR(100) NOT NULL,
    "quantity" NUMERIC(15, 4) NOT NULL,
    "unitPrice" NUMERIC(15, 4) NOT NULL,
    "costPrice" NUMERIC(15, 4) DEFAULT 0 NOT NULL,
    "discountAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "taxAmount" NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    "lineTotal" NUMERIC(15, 2) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Payments
CREATE TABLE IF NOT EXISTS "payments" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64),
    "storeId" VARCHAR(64),
    "customerId" VARCHAR(64) REFERENCES "customers"("id") ON DELETE SET NULL,
    "supplierId" VARCHAR(64) REFERENCES "suppliers"("id") ON DELETE SET NULL,
    "saleId" VARCHAR(64) REFERENCES "sales"("id") ON DELETE SET NULL,
    "purchaseOrderId" VARCHAR(64) REFERENCES "purchase_orders"("id") ON DELETE SET NULL,
    "cashAccountId" VARCHAR(64) REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
    "type" "PaymentType" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" NUMERIC(15, 2) NOT NULL,
    "reference" VARCHAR(100),
    "paymentDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentStatus" DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(64)
);

-- 16. Expense Categories & Expenses
CREATE TABLE IF NOT EXISTS "expense_categories" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_cat_org_name_unique" UNIQUE ("organizationId", "name")
);

CREATE TABLE IF NOT EXISTS "expenses" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "storeId" VARCHAR(64) REFERENCES "stores"("id") ON DELETE SET NULL,
    "categoryId" VARCHAR(64) NOT NULL REFERENCES "expense_categories"("id") ON DELETE RESTRICT,
    "amount" NUMERIC(15, 2) NOT NULL,
    "expenseDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "status" "ExpenseStatus" DEFAULT 'PENDING',
    "approvedBy" VARCHAR(64),
    "approvedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(64)
);

-- 17. Returns
CREATE TABLE IF NOT EXISTS "sale_returns" (
    "id" VARCHAR(64) PRIMARY KEY,
    "saleId" VARCHAR(64) NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
    "returnNumber" VARCHAR(100) NOT NULL,
    "returnDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "status" "ReturnStatus" DEFAULT 'DRAFT',
    "refundMethod" VARCHAR(50),
    "totalAmount" NUMERIC(15, 2) NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(64)
);

-- 18. Audit Logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" VARCHAR(64) PRIMARY KEY,
    "organizationId" VARCHAR(64) NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "actorId" VARCHAR(64) REFERENCES "users"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(100),
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    "storeId" VARCHAR(64),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
