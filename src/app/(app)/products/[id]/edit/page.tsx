import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { serializeData } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Edit ${product.name} — FabricPro` : "Edit Fabric — FabricPro" };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;

  const [product, categories, brands, units] = await Promise.all([
    prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        barcodes: { where: { isPrimary: true }, take: 1 },
      },
    }),
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

  if (!product) notFound();

  return (
    <ProductForm
      initialData={serializeData(product)}
      categories={categories}
      brands={brands}
      units={units}
      isEdit={true}
    />
  );
}
