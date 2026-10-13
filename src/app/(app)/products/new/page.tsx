import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/products/product-form";

export const metadata = {
  title: "Add Product — FabricPro",
  description: "Add a new product to your inventory catalog",
};

export default async function NewProductPage() {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;

  const [categories, countries, brands, units] = await Promise.all([
    prisma.category.findMany({
      where: { organizationId, isActive: true, parentId: null },
      select: {
        id: true,
        name: true,
        children: {
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.country.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProductForm
      categories={categories}
      countries={countries}
      brands={brands}
      units={units}
      isEdit={false}
    />
  );
}
