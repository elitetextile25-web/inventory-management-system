import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PurchaseSourceSchema = z.object({
  sourceName: z.string().min(1, "Source name is required").trim(),
  sourceType: z.string().min(1, "Source type is required"),
  supplierName: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  emailAddress: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  country: z.string().min(1, "Country is required"),
  division: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  upazila: z.string().optional().nullable(),
  marketName: z.string().optional().nullable(),
  areaStreet: z.string().optional().nullable(),
  buildingName: z.string().optional().nullable(),
  shopNumber: z.string().optional().nullable(),
  fullAddress: z.string().optional().nullable(),
  googleMapsLocation: z.string().optional().nullable(),
  preferredCurrency: z.string().default("BDT"),
  paymentTerms: z.string().optional().nullable(),
  supplierNotes: z.string().optional().nullable(),
  additionalDescription: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
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
    const type = searchParams.get("type");
    const country = searchParams.get("country");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { sourceName: { contains: search, mode: "insensitive" } },
        { sourceCode: { contains: search, mode: "insensitive" } },
        { supplierName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { marketName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type && type !== "ALL") {
      where.sourceType = type;
    }

    if (country && country !== "ALL") {
      where.country = country;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [sources, total] = await Promise.all([
      prisma.purchaseSource.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: { purchaseOrders: true },
          },
        },
      }),
      prisma.purchaseSource.count({ where }),
    ]);

    return NextResponse.json({
      data: sources,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET purchase sources error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchase sources" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const userId = session?.user?.id;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = PurchaseSourceSchema.parse(body);

    // Auto-generate unique source code: SRC-000001
    const totalSources = await prisma.purchaseSource.count({
      where: { organizationId },
    });
    let seq = totalSources + 1;
    let sourceCode = `SRC-${String(seq).padStart(6, "0")}`;

    // Ensure uniqueness
    let exists = await prisma.purchaseSource.findUnique({
      where: {
        organizationId_sourceCode: {
          organizationId,
          sourceCode,
        },
      },
    });

    while (exists) {
      seq += 1;
      sourceCode = `SRC-${String(seq).padStart(6, "0")}`;
      exists = await prisma.purchaseSource.findUnique({
        where: {
          organizationId_sourceCode: {
            organizationId,
            sourceCode,
          },
        },
      });
    }

    const source = await prisma.purchaseSource.create({
      data: {
        organizationId,
        sourceCode,
        sourceName: validated.sourceName,
        sourceType: validated.sourceType,
        supplierName: validated.supplierName || null,
        contactPerson: validated.contactPerson || null,
        phoneNumber: validated.phoneNumber || null,
        whatsappNumber: validated.whatsappNumber || null,
        emailAddress: validated.emailAddress || null,
        website: validated.website || null,
        country: validated.country,
        division: validated.division || null,
        city: validated.city || null,
        district: validated.district || null,
        upazila: validated.upazila || null,
        marketName: validated.marketName || null,
        areaStreet: validated.areaStreet || null,
        buildingName: validated.buildingName || null,
        shopNumber: validated.shopNumber || null,
        fullAddress: validated.fullAddress || null,
        googleMapsLocation: validated.googleMapsLocation || null,
        preferredCurrency: validated.preferredCurrency || "BDT",
        paymentTerms: validated.paymentTerms || null,
        supplierNotes: validated.supplierNotes || null,
        additionalDescription: validated.additionalDescription || null,
        status: validated.status || "ACTIVE",
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: userId || null,
          action: "CREATE",
          entityType: "PURCHASE_SOURCE",
          entityId: source.id,
          newValues: {
            sourceName: source.sourceName,
            sourceCode: source.sourceCode,
            sourceType: source.sourceType,
            country: source.country,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    return NextResponse.json({ success: true, data: source }, { status: 201 });
  } catch (error: any) {
    console.error("POST purchase source error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create purchase source" },
      { status: 500 }
    );
  }
}

