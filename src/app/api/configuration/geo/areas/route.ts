import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const AreaSchema = z.object({
  districtId: z.string().min(1, "District is required"),
  name: z.string().min(1, "Area name is required").trim(),
  postalCode: z.string().optional().nullable(),
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
    const districtId = searchParams.get("districtId");
    const divisionId = searchParams.get("divisionId");
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search") || "";

    const areas = await prisma.area.findMany({
      where: {
        organizationId,
        ...(districtId ? { districtId } : {}),
        ...(divisionId ? { district: { divisionId } } : {}),
        ...(countryId ? { district: { division: { countryId } } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { postalCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        district: {
          select: {
            id: true,
            name: true,
            division: {
              select: {
                id: true,
                name: true,
                country: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    return NextResponse.json({ data: areas });
  } catch (error: any) {
    console.error("GET areas error:", error);
    return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 });
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
    const validated = AreaSchema.parse(body);

    // Validate District belongs to organization
    const district = await prisma.district.findFirst({
      where: { id: validated.districtId, organizationId },
      include: { division: true },
    });

    if (!district) {
      return NextResponse.json({ error: "Selected district was not found" }, { status: 404 });
    }

    const existing = await prisma.area.findFirst({
      where: {
        districtId: validated.districtId,
        name: { equals: validated.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Area "${validated.name}" already exists in ${district.name} district.` },
        { status: 409 }
      );
    }

    const area = await prisma.area.create({
      data: {
        organizationId,
        districtId: validated.districtId,
        name: validated.name,
        postalCode: validated.postalCode?.trim() || null,
        isActive: validated.isActive,
      },
      include: {
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
    });

    return NextResponse.json({ success: true, data: area }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("POST area error:", error);
    return NextResponse.json({ error: "Failed to create area" }, { status: 500 });
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
      return NextResponse.json({ error: "Area ID is required" }, { status: 400 });
    }

    const existing = await prisma.area.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const updated = await prisma.area.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : existing.name,
        postalCode: data.postalCode !== undefined ? (data.postalCode?.trim() || null) : existing.postalCode,
        districtId: data.districtId || existing.districtId,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      },
      include: {
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
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT area error:", error);
    return NextResponse.json({ error: "Failed to update area" }, { status: 500 });
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
      return NextResponse.json({ error: "Area ID is required" }, { status: 400 });
    }

    const area = await prisma.area.findFirst({
      where: { id, organizationId },
    });

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    await prisma.area.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Area deleted successfully" });
  } catch (error: any) {
    console.error("DELETE area error:", error);
    return NextResponse.json({ error: "Failed to delete area" }, { status: 500 });
  }
}
