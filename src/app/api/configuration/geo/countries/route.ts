import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CountrySchema = z.object({
  name: z.string().min(1, "Country name is required").trim(),
  code: z.string().optional().nullable(),
  phoneCode: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
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
    const search = searchParams.get("search") || "";

    const countries = await prisma.country.findMany({
      where: {
        organizationId,
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
        _count: {
          select: { divisions: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: countries });
  } catch (error: any) {
    console.error("GET countries error:", error);
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
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
    const validated = CountrySchema.parse(body);

    const existing = await prisma.country.findFirst({
      where: {
        organizationId,
        name: { equals: validated.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Country "${validated.name}" already exists.` },
        { status: 409 }
      );
    }

    const country = await prisma.country.create({
      data: {
        organizationId,
        name: validated.name,
        code: validated.code?.trim().toUpperCase() || null,
        phoneCode: validated.phoneCode?.trim() || null,
        currency: validated.currency?.trim().toUpperCase() || null,
        isActive: validated.isActive,
      },
    });

    return NextResponse.json({ success: true, data: country }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("POST country error:", error);
    return NextResponse.json({ error: "Failed to create country" }, { status: 500 });
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
      return NextResponse.json({ error: "Country ID is required" }, { status: 400 });
    }

    const existing = await prisma.country.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    const updated = await prisma.country.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : existing.name,
        code: data.code !== undefined ? (data.code?.trim().toUpperCase() || null) : existing.code,
        phoneCode: data.phoneCode !== undefined ? (data.phoneCode?.trim() || null) : existing.phoneCode,
        currency: data.currency !== undefined ? (data.currency?.trim().toUpperCase() || null) : existing.currency,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT country error:", error);
    return NextResponse.json({ error: "Failed to update country" }, { status: 500 });
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
      return NextResponse.json({ error: "Country ID is required" }, { status: 400 });
    }

    const country = await prisma.country.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { divisions: true } },
      },
    });

    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    if (country._count.divisions > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${country.name}" because it contains ${country._count.divisions} divisions. Please remove them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.country.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Country deleted successfully" });
  } catch (error: any) {
    console.error("DELETE country error:", error);
    return NextResponse.json({ error: "Failed to delete country" }, { status: 500 });
  }
}
