import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const DivisionSchema = z.object({
  countryId: z.string().min(1, "Country is required"),
  name: z.string().min(1, "Division name is required").trim(),
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
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search") || "";

    const divisions = await prisma.division.findMany({
      where: {
        organizationId,
        ...(countryId ? { countryId } : {}),
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
        country: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { districts: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: divisions });
  } catch (error: any) {
    console.error("GET divisions error:", error);
    return NextResponse.json({ error: "Failed to fetch divisions" }, { status: 500 });
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
    const validated = DivisionSchema.parse(body);

    // Validate Country belongs to organization
    const country = await prisma.country.findFirst({
      where: { id: validated.countryId, organizationId },
    });

    if (!country) {
      return NextResponse.json({ error: "Selected country was not found" }, { status: 404 });
    }

    const existing = await prisma.division.findFirst({
      where: {
        countryId: validated.countryId,
        name: { equals: validated.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Division "${validated.name}" already exists in ${country.name}.` },
        { status: 409 }
      );
    }

    const division = await prisma.division.create({
      data: {
        organizationId,
        countryId: validated.countryId,
        name: validated.name,
        code: validated.code?.trim().toUpperCase() || null,
        isActive: validated.isActive,
      },
      include: {
        country: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: division }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("POST division error:", error);
    return NextResponse.json({ error: "Failed to create division" }, { status: 500 });
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
      return NextResponse.json({ error: "Division ID is required" }, { status: 400 });
    }

    const existing = await prisma.division.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Division not found" }, { status: 404 });
    }

    const updated = await prisma.division.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : existing.name,
        code: data.code !== undefined ? (data.code?.trim().toUpperCase() || null) : existing.code,
        countryId: data.countryId || existing.countryId,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      },
      include: {
        country: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT division error:", error);
    return NextResponse.json({ error: "Failed to update division" }, { status: 500 });
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
      return NextResponse.json({ error: "Division ID is required" }, { status: 400 });
    }

    const division = await prisma.division.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { districts: true } },
      },
    });

    if (!division) {
      return NextResponse.json({ error: "Division not found" }, { status: 404 });
    }

    if (division._count.districts > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete division "${division.name}" because it contains ${division._count.districts} districts. Please remove them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.division.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Division deleted successfully" });
  } catch (error: any) {
    console.error("DELETE division error:", error);
    return NextResponse.json({ error: "Failed to delete division" }, { status: 500 });
  }
}
