import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const DistrictSchema = z.object({
  divisionId: z.string().min(1, "Division is required"),
  name: z.string().min(1, "District name is required").trim(),
  code: z.string().optional().nullable(),
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
    const divisionId = searchParams.get("divisionId");
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search") || "";

    const districts = await prisma.district.findMany({
      where: {
        organizationId,
        ...(divisionId ? { divisionId } : {}),
        ...(countryId ? { division: { countryId } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
            country: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: { areas: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: districts });
  } catch (error: any) {
    console.error("GET districts error:", error);
    return NextResponse.json({ error: "Failed to fetch districts" }, { status: 500 });
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
    const validated = DistrictSchema.parse(body);

    // Validate Division belongs to organization
    const division = await prisma.division.findFirst({
      where: { id: validated.divisionId, organizationId },
      include: { country: true },
    });

    if (!division) {
      return NextResponse.json({ error: "Selected division was not found" }, { status: 404 });
    }

    const existing = await prisma.district.findFirst({
      where: {
        divisionId: validated.divisionId,
        name: { equals: validated.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `District "${validated.name}" already exists in ${division.name} division.` },
        { status: 409 }
      );
    }

    const district = await prisma.district.create({
      data: {
        organizationId,
        divisionId: validated.divisionId,
        name: validated.name,
        code: validated.code?.trim().toUpperCase() || null,
        isActive: validated.isActive,
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            country: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: district }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("POST district error:", error);
    return NextResponse.json({ error: "Failed to create district" }, { status: 500 });
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
      return NextResponse.json({ error: "District ID is required" }, { status: 400 });
    }

    const existing = await prisma.district.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    const updated = await prisma.district.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : existing.name,
        code: data.code !== undefined ? (data.code?.trim().toUpperCase() || null) : existing.code,
        divisionId: data.divisionId || existing.divisionId,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            country: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT district error:", error);
    return NextResponse.json({ error: "Failed to update district" }, { status: 500 });
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
      return NextResponse.json({ error: "District ID is required" }, { status: 400 });
    }

    const district = await prisma.district.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { areas: true } },
      },
    });

    if (!district) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    if (district._count.areas > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete district "${district.name}" because it contains ${district._count.areas} areas. Please remove them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.district.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "District deleted successfully" });
  } catch (error: any) {
    console.error("DELETE district error:", error);
    return NextResponse.json({ error: "Failed to delete district" }, { status: 500 });
  }
}
