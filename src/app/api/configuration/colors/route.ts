import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_COLORS = [
  { name: "Black", hexCode: "#000000" },
  { name: "White", hexCode: "#FFFFFF" },
  { name: "Navy Blue", hexCode: "#001F3F" },
  { name: "Royal Blue", hexCode: "#4169E1" },
  { name: "Sky Blue", hexCode: "#87CEEB" },
  { name: "Maroon", hexCode: "#800000" },
  { name: "Crimson Red", hexCode: "#DC143C" },
  { name: "Olive Green", hexCode: "#556B2F" },
  { name: "Forest Green", hexCode: "#228B22" },
  { name: "Heather Grey", hexCode: "#9E9E9E" },
  { name: "Charcoal", hexCode: "#36454F" },
  { name: "Khaki", hexCode: "#F0E68C" },
  { name: "Beige / Cream", hexCode: "#F5F5DC" },
  { name: "Mustard Yellow", hexCode: "#FFDB58" },
  { name: "Pastel Pink", hexCode: "#FFD1DC" },
  { name: "Orange", hexCode: "#FFA500" },
  { name: "Purple", hexCode: "#800080" },
  { name: "Multicolor", hexCode: "#9C27B0" },
];

export async function GET(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let colors = await prisma.color.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    // Auto-seed default colors if none exist
    if (colors.length === 0) {
      for (const dc of DEFAULT_COLORS) {
        await prisma.color.create({
          data: {
            organizationId,
            name: dc.name,
            hexCode: dc.hexCode,
          },
        }).catch(() => {});
      }
      colors = await prisma.color.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ data: colors });
  } catch (error: any) {
    console.error("GET colors error:", error);
    return NextResponse.json({ error: "Failed to fetch colors" }, { status: 500 });
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
    const { name, hexCode } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Color name is required" }, { status: 400 });
    }

    const existing = await prisma.color.findFirst({
      where: {
        organizationId,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json({ data: existing });
    }

    const color = await prisma.color.create({
      data: {
        organizationId,
        name: name.trim(),
        hexCode: hexCode?.trim() || null,
      },
    });

    return NextResponse.json({ data: color }, { status: 201 });
  } catch (error: any) {
    console.error("POST color error:", error);
    return NextResponse.json({ error: "Failed to create color" }, { status: 500 });
  }
}

