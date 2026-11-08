import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateStorageLocationSchema = z.object({
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const location = await prisma.storageLocation.findFirst({
      where: { id, organizationId },
      include: {
        parentWarehouse: {
          select: { id: true, name: true, code: true },
        },
        childWarehouses: {
          select: { id: true, name: true, code: true, type: true, status: true },
        },
        inventoryBalances: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                purchaseCost: true,
                sellingPrice: true,
                unit: { select: { name: true, abbreviation: true } },
                category: { select: { name: true } },
              },
            },
          },
          orderBy: { quantity: "desc" },
          take: 50,
        },
        stockMovements: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
            transfersFrom: true,
            transfersTo: true,
            childWarehouses: true,
            inventoryBalances: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: "Storage location not found" }, { status: 404 });
    }

    // Calculate total stock units currently in this location
    const totalStockQuantity = location.inventoryBalances.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );

    return NextResponse.json({
      data: {
        ...location,
        totalStockQuantity,
      },
    });
  } catch (error: any) {
    console.error("GET storage location detail error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch storage location" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const userId = session?.user?.id;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = UpdateStorageLocationSchema.parse(body);

    const existing = await prisma.storageLocation.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Storage location not found" }, { status: 404 });
    }

    // Prevent selecting self as parent warehouse
    if (validated.parentWarehouseId === id) {
      return NextResponse.json(
        { error: "A storage location cannot be its own parent warehouse." },
        { status: 400 }
      );
    }

    const updated = await prisma.storageLocation.update({
      where: { id },
      data: {
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
        status: validated.status,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: userId || null,
          action: "UPDATE",
          entityType: "STORAGE_LOCATION",
          entityId: id,
          oldValues: { name: existing.name, status: existing.status },
          newValues: { name: updated.name, status: updated.status },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT storage location error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update storage location" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const userId = session?.user?.id;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const location = await prisma.storageLocation.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            transfersFrom: true,
            transfersTo: true,
            childWarehouses: true,
          },
        },
        inventoryBalances: {
          where: {
            quantity: { gt: 0 },
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: "Storage location not found" }, { status: 404 });
    }

    // Safety checks: Prevent deleting if historical transactions or active inventory exist
    if (location.inventoryBalances.length > 0) {
      const activeProductsCount = location.inventoryBalances.length;
      return NextResponse.json(
        {
          error: `Cannot delete storage location "${location.name}" because it currently holds inventory for ${activeProductsCount} product(s). Please transfer or adjust the inventory to 0, or mark the location as INACTIVE.`,
          canDeactivate: true,
        },
        { status: 400 }
      );
    }

    if (location._count.purchaseOrders > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete storage location "${location.name}" because it has ${location._count.purchaseOrders} historical purchase receipt(s). Set status to INACTIVE instead.`,
          canDeactivate: true,
        },
        { status: 400 }
      );
    }

    if (location._count.transfersFrom > 0 || location._count.transfersTo > 0) {
      const totalTransfers = location._count.transfersFrom + location._count.transfersTo;
      return NextResponse.json(
        {
          error: `Cannot delete storage location "${location.name}" because it is linked to ${totalTransfers} historical stock transfer(s). Set status to INACTIVE instead.`,
          canDeactivate: true,
        },
        { status: 400 }
      );
    }

    if (location._count.childWarehouses > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete storage location "${location.name}" because ${location._count.childWarehouses} sub-warehouse(s) are linked to it as their parent. Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.storageLocation.delete({
      where: { id },
    });

    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: userId || null,
          action: "DELETE",
          entityType: "STORAGE_LOCATION",
          entityId: id,
          oldValues: {
            name: location.name,
            code: location.code,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Storage location "${location.name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE storage location error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete storage location" },
      { status: 500 }
    );
  }
}

