import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PatchPurchaseSchema = z.object({
  status: z.enum(["DRAFT", "ORDERED", "RECEIVED", "PARTIALLY_PAID", "PAID", "CANCELLED"]).optional(),
  notes: z.string().optional().nullable(),
  purchaseSourceId: z.string().optional().nullable(),
  storageLocationId: z.string().optional().nullable(),
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

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        store: { organizationId },
      },
      include: {
        supplier: true,
        purchaseSource: true,
        storageLocation: true,
        items: {
          include: {
            product: {
              include: { unit: true },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error: any) {
    console.error("GET purchase [id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchase order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const validated = PatchPurchaseSchema.parse(body);

    const existing = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        store: { organizationId },
      },
      include: {
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const isNewlyReceived =
      validated.status === "RECEIVED" &&
      existing.status !== "RECEIVED" &&
      existing.status !== "PAID";

    const targetStorageLocationId = validated.storageLocationId !== undefined ? validated.storageLocationId : existing.storageLocationId;

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: validated.status as any || existing.status,
          notes: validated.notes !== undefined ? validated.notes : existing.notes,
          purchaseSourceId: validated.purchaseSourceId !== undefined ? validated.purchaseSourceId : existing.purchaseSourceId,
          storageLocationId: targetStorageLocationId,
        },
        include: {
          supplier: true,
          purchaseSource: true,
          storageLocation: true,
          items: true,
        },
      });

      // If status just transitioned to RECEIVED, increment stock
      if (isNewlyReceived) {
        for (const item of existing.items) {
          // 1. Store inventory balance
          await tx.inventoryBalance.upsert({
            where: {
              storeId_productId: {
                storeId: existing.storeId,
                productId: item.productId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              storeId: existing.storeId,
              productId: item.productId,
              quantity: item.quantity,
              averageCost: item.unitCost,
            },
          });

          await tx.stockMovement.create({
            data: {
              storeId: existing.storeId,
              productId: item.productId,
              type: "PURCHASE_RECEIPT",
              quantity: item.quantity,
              unitCost: item.unitCost,
              referenceType: "PURCHASE",
              referenceId: order.id,
              notes: `PO ${order.orderNumber} confirmed as received (${item.quantity} units)`,
              createdBy: userId || null,
            },
          });

          // 2. Storage location inventory balance if location is set
          if (targetStorageLocationId) {
            await tx.storageInventoryBalance.upsert({
              where: {
                storageLocationId_productId: {
                  storageLocationId: targetStorageLocationId,
                  productId: item.productId,
                },
              },
              update: {
                quantity: { increment: item.quantity },
              },
              create: {
                storageLocationId: targetStorageLocationId,
                productId: item.productId,
                quantity: item.quantity,
                averageCost: item.unitCost,
              },
            });

            await tx.storageStockMovement.create({
              data: {
                storageLocationId: targetStorageLocationId,
                productId: item.productId,
                type: "PURCHASE_RECEIPT",
                quantity: item.quantity,
                unitCost: item.unitCost,
                referenceType: "PURCHASE",
                referenceId: order.id,
                notes: `PO ${order.orderNumber} received into storage location`,
                createdBy: userId || null,
              },
            });
          }
        }
      }

      return order;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH purchase [id] error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

