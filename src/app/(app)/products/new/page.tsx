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

  const [categories, brands, units] = await Promise.all([
    prisma.category.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true },
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
      brands={brands}
      units={units}
      isEdit={false}
    />
  );
}
