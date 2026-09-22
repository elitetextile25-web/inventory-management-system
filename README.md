# Inventory-Management-System

FabricPro — Modern Textile & Fabric Inventory Management System with POS, cutting roll tracker, and Supabase cloud database.

## Features
- **Fabric Catalog & Stock Management**: Track meter rolls, categories, brands, suppliers, purchase costs, and retail prices.
- **Cutting Counter POS**: Integrated point of sale with meter calculations, invoice generation, and thermal receipt printing.
- **Universal Bill & Receipt Printing**: Supports 80mm & 58mm thermal POS slips, A4 invoices, and historical receipt search across past days and years.
- **Finance & Accounting**: Track mill purchases, sales revenue, store expenses, profit & loss, and audit logs.
- **Supabase Cloud Database**: Powered by Supabase PostgreSQL with Prisma ORM.

## Tech Stack
- Next.js (App Router, Turbopack)
- React 19, Tailwind CSS
- Prisma ORM & Supabase PostgreSQL
- NextAuth authentication

## Deploy to Netlify
1. Connect this repository to Netlify.
2. In Netlify Site Settings > Environment Variables, configure:
   - `DATABASE_URL` (Supabase connection pooler URL)
   - `DIRECT_URL` (Supabase direct connection URL)
   - `AUTH_SECRET` / `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (Your Netlify site URL)
3. Netlify will build automatically using `netlify.toml`.
