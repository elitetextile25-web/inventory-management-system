import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ShopSchema = z.object({
  areaId: z.string().min(1, "Area is required"),
  name: z.string().min(1, "Shop name is required").trim(),
  code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const areaId = searchParams.get("areaId");
    const districtId = searchParams.get("districtId");
    const divisionId = searchParams.get("divisionId");
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search") || "";

    const shops = await prisma.shop.findMany({
      where: {
        organizationId,
        ...(areaId ? { areaId } : {}),
        ...(districtId ? { area: { districtId } } : {}),
        ...(divisionId ? { area: { district: { divisionId } } } : {}),
        ...(countryId ? { area: { district: { division: { countryId } } } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { code: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            district: {
              select: {
                id: true,
                name: true,
                division: {
                  select: {
                    id: true,
                    name: true,
                    country: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    return NextResponse.json({ data: shops });
  } catch (error: any) {
    console.error("GET shops error:", error);
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = ShopSchema.parse(body);

    // Validate area belongs to org
    const area = await prisma.area.findFirst({
      where: { id: validated.areaId, organizationId },
    });
    if (!area) {
      return NextResponse.json({ error: "Selected area was not found" }, { status: 404 });
    }

    // Check duplicate name within area
    const existing = await prisma.shop.findFirst({
      where: {
        areaId: validated.areaId,
        name: { equals: validated.name, mode: "insensitive" },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Shop "${validated.name}" already exists in ${area.name} area.` },
        { status: 409 }
      );
    }

    const shop = await prisma.shop.create({
      data: {
        organizationId,
        areaId: validated.areaId,
        name: validated.name,
        code: validated.code?.trim() || null,
        address: validated.address?.trim() || null,
        contactName: validated.contactName?.trim() || null,
        contactPhone: validated.contactPhone?.trim() || null,
        isActive: validated.isActive,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            district: {
              select: {
                id: true,
                name: true,
                division: {
                  select: {
                    id: true,
                    name: true,
                    country: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: shop }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("POST shop error:", error);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Shop ID is required" }, { status: 400 });
    }

    const existing = await prisma.shop.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : existing.name,
        code: data.code !== undefined ? (data.code?.trim() || null) : existing.code,
        address: data.address !== undefined ? (data.address?.trim() || null) : existing.address,
        contactName: data.contactName !== undefined ? (data.contactName?.trim() || null) : existing.contactName,
        contactPhone: data.contactPhone !== undefined ? (data.contactPhone?.trim() || null) : existing.contactPhone,
        areaId: data.areaId || existing.areaId,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      },
      include: {
        area: {
          select: {
            id: true,
            name: true,
            district: {
              select: {
                id: true,
                name: true,
                division: {
                  select: {
                    id: true,
                    name: true,
                    country: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT shop error:", error);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Shop ID is required" }, { status: 400 });
    }

    const shop = await prisma.shop.findFirst({
      where: { id, organizationId },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Unassign any products attached to this shop
      await tx.product.updateMany({
        where: { shopId: id },
        data: { shopId: null },
      });

      await tx.shop.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Shop deleted successfully" });
  } catch (error: any) {
    console.error("DELETE shop error:", error);
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 });
  }
}
