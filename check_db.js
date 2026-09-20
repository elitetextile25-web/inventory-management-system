const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const orgs = await p.organization.findMany();
  const prods = await p.product.findMany();
  const cats = await p.category.findMany();
  const units = await p.unit.findMany();
  const brands = await p.brand.findMany();
  const stores = await p.store.findMany();
  console.log('Orgs:', orgs);
  console.log('Stores:', stores);
  console.log('Products:', prods);
  console.log('Categories:', cats);
  console.log('Units:', units);
  console.log('Brands:', brands);
}

main().catch(console.error).finally(() => p.$disconnect());
