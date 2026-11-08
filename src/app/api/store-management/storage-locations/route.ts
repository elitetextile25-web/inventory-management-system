import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const StorageLocationSchema = z.object({
  name: z.string().min(1, "Store name is required").trim(),
  type: z.string().min(1, "Store type is required"),
  storeManager: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  parentWarehouseId: z.string().optional().nullable(),
  capacity: z.coerce.number().min(0).optional().nullable(),
  capacityUnit: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  division: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  upazila: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  streetRoad: z.string().optional().nullable(),
  buildingName: z.string().optional().nullable(),
  floorNumber: z.string().optional().nullable(),
  fullAddress: z.string().optional().nullable(),
  googleMapsLocation: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
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
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { storeManager: { contains: search, mode: "insensitive" } },
        { contactNumber: { contains: search, mode: "insensitive" } },
        { fullAddress: { contains: search, mode: "insensitive" } },
        { area: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [locations, total] = await Promise.all([
      prisma.storageLocation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          parentWarehouse: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: {
              childWarehouses: true,
              purchaseOrders: true,
              inventoryBalances: true,
              transfersFrom: true,
              transfersTo: true,
            },
          },
        },
      }),
      prisma.storageLocation.count({ where }),
    ]);

    return NextResponse.json({
      data: locations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET storage locations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch storage locations" },
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
    const validated = StorageLocationSchema.parse(body);

    // Auto-generate unique store code: LOC-000001
    const totalLocations = await prisma.storageLocation.count({
      where: { organizationId },
    });
    let seq = totalLocations + 1;
    let code = `LOC-${String(seq).padStart(6, "0")}`;

    // Ensure uniqueness
    let exists = await prisma.storageLocation.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code,
        },
      },
    });

    while (exists) {
      seq += 1;
      code = `LOC-${String(seq).padStart(6, "0")}`;
      exists = await prisma.storageLocation.findUnique({
        where: {
          organizationId_code: {
            organizationId,
            code,
          },
        },
      });
    }

    const location = await prisma.storageLocation.create({
      data: {
        organizationId,
        code,
        name: validated.name,
        type: validated.type,
        storeManager: validated.storeManager || null,
        contactNumber: validated.contactNumber || null,
        email: validated.email || null,
        parentWarehouseId: validated.parentWarehouseId || null,
        capacity: validated.capacity !== undefined && validated.capacity !== null ? validated.capacity : null,
        capacityUnit: validated.capacityUnit || null,
        country: validated.country || "Bangladesh",
        division: validated.division || null,
        district: validated.district || null,
        upazila: validated.upazila || null,
        area: validated.area || null,
        streetRoad: validated.streetRoad || null,
        buildingName: validated.buildingName || null,
        floorNumber: validated.floorNumber || null,
        fullAddress: validated.fullAddress || null,
        googleMapsLocation: validated.googleMapsLocation || null,
        description: validated.description || null,
        notes: validated.notes || null,
        status: validated.status || "ACTIVE",
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: userId || null,
          action: "CREATE",
          entityType: "STORAGE_LOCATION",
          entityId: location.id,
          newValues: {
            name: location.name,
            code: location.code,
            type: location.type,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error: any) {
    console.error("POST storage location error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create storage location" },
      { status: 500 }
    );
  }
}

