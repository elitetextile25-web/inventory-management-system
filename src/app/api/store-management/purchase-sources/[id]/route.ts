import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdatePurchaseSourceSchema = z.object({
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

    const source = await prisma.purchaseSource.findFirst({
      where: { id, organizationId },
      include: {
        purchaseOrders: {
          take: 10,
          orderBy: { orderDate: "desc" },
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            status: true,
            grandTotal: true,
            paidAmount: true,
            dueAmount: true,
          },
        },
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Purchase source not found" }, { status: 404 });
    }

    return NextResponse.json({ data: source });
  } catch (error: any) {
    console.error("GET purchase source detail error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchase source" },
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
    const validated = UpdatePurchaseSourceSchema.parse(body);

    const existing = await prisma.purchaseSource.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Purchase source not found" }, { status: 404 });
    }

    const updated = await prisma.purchaseSource.update({
      where: { id },
      data: {
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
        preferredCurrency: validated.preferredCurrency,
        paymentTerms: validated.paymentTerms || null,
        supplierNotes: validated.supplierNotes || null,
        additionalDescription: validated.additionalDescription || null,
        status: validated.status,
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: userId || null,
          action: "UPDATE",
          entityType: "PURCHASE_SOURCE",
          entityId: id,
          oldValues: {
            sourceName: existing.sourceName,
            status: existing.status,
          },
          newValues: {
            sourceName: updated.sourceName,
            status: updated.status,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT purchase source error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update purchase source" },
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

    const source = await prisma.purchaseSource.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Purchase source not found" }, { status: 404 });
    }

    // Safety check: Prevent deleting if historical purchase orders exist
    if (source._count.purchaseOrders > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete purchase source "${source.sourceName}" because it has ${source._count.purchaseOrders} historical purchase order(s). Please set its status to INACTIVE instead to preserve audit history.`,
          canDeactivate: true,
        },
        { status: 400 }
      );
    }

    await prisma.purchaseSource.delete({
      where: { id },
    });

    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: userId || null,
          action: "DELETE",
          entityType: "PURCHASE_SOURCE",
          entityId: id,
          oldValues: {
            sourceName: source.sourceName,
            sourceCode: source.sourceCode,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Purchase source "${source.sourceName}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE purchase source error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete purchase source" },
      { status: 500 }
    );
  }
}

