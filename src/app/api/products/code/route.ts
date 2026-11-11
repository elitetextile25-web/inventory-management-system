import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProductCodePrefix, previewNextProductCode } from "@/lib/product-code";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");

    let categoryName: string | null = null;
    if (categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });
      categoryName = cat?.name ?? null;
    }

    const prefix = getProductCodePrefix(type, categoryName);
    const code = await previewNextProductCode(organizationId, prefix);

    return NextResponse.json({
      prefix,
      code,
    });
  } catch (error: any) {
    console.error("GET product code preview error:", error);
    return NextResponse.json({ error: "Failed to preview product code" }, { status: 500 });
  }
}

