import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { serializeData } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Edit ${product.name} — FabricPro` : "Edit Product — FabricPro" };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const { id } = await params;

  const [product, categories, countries, brands, units, storageLocations, suppliers, colors] =
    await Promise.all([
      prisma.product.findFirst({
        where: { id, organizationId },
        include: {
          barcodes: { where: { isPrimary: true }, take: 1 },
          images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
          colors: { include: { color: true } },
          supplierProducts: { take: 1 },
          storageLocation: true,
        },
      }),
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
      prisma.storageLocation.findMany({
        where: { organizationId, status: "ACTIVE" },
        select: { id: true, name: true, code: true, type: true },
        orderBy: { name: "asc" },
      }),
      prisma.supplier.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, company: true },
        orderBy: { name: "asc" },
      }),
      prisma.color.findMany({
        where: { organizationId },
        select: { id: true, name: true, hexCode: true },
        orderBy: { name: "asc" },
      }),
    ]);

  if (!product) notFound();

  return (
    <ProductForm
      initialData={serializeData(product)}
      categories={serializeData(categories) as any}
      countries={serializeData(countries) as any}
      brands={serializeData(brands) as any}
      units={serializeData(units) as any}
      storageLocations={serializeData(storageLocations) as any}
      suppliers={serializeData(suppliers) as any}
      availableColors={serializeData(colors) as any}
      isEdit={true}
    />
  );
}
