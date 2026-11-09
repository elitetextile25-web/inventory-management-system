import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    const { id } = await params;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                purchaseCost: true,
                unit: { select: { abbreviation: true } },
              },
            },
          },
        },
      },
    });

    if (!adjustment) {
      return NextResponse.json({ error: "Stock adjustment not found" }, { status: 404 });
    }

    return NextResponse.json({ data: adjustment });
  } catch (error: any) {
    console.error("GET adjustment [id] error:", error);
    return NextResponse.json({ error: "Failed to fetch adjustment" }, { status: 500 });
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
    const { id } = await params;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stock adjustment not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body; // "APPROVE" or "VOID"

    if (action === "APPROVE") {
      if (existing.status !== "DRAFT") {
        return NextResponse.json(
          { error: `Cannot approve adjustment with status "${existing.status}"` },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Update adjustment status
        await tx.stockAdjustment.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });

        // Apply inventory updates
        for (const item of existing.items) {
          const adjQty = Number(item.adjustedQuantity);
          const diff = Number(item.difference);

          const prod = await tx.product.findUnique({
            where: { id: item.productId },
            select: { purchaseCost: true },
          });
          const unitCost = prod ? Number(prod.purchaseCost) : 0;

          await tx.inventoryBalance.upsert({
            where: {
              storeId_productId: {
                storeId: existing.storeId,
                productId: item.productId,
              },
            },
            update: {
              quantity: adjQty,
            },
            create: {
              storeId: existing.storeId,
              productId: item.productId,
              quantity: adjQty,
              averageCost: unitCost,
            },
          });

          if (diff !== 0) {
            await tx.stockMovement.create({
              data: {
                storeId: existing.storeId,
                productId: item.productId,
                type: diff > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
                quantity: Math.abs(diff),
                unitCost,
                referenceType: "STOCK_ADJUSTMENT",
                referenceId: existing.id,
                notes: `Adjustment #${existing.reference}: ${existing.reason}${item.notes ? ` - ${item.notes}` : ""}`,
                createdBy: userId,
              },
            });
          }
        }
      });

      return NextResponse.json({ success: true, message: `Adjustment ${existing.reference} approved and inventory reconciled.` });
    }

    if (action === "VOID") {
      if (existing.status === "VOIDED") {
        return NextResponse.json({ error: "Adjustment is already voided" }, { status: 400 });
      }

      await prisma.stockAdjustment.update({
        where: { id },
        data: { status: "VOIDED" },
      });

      return NextResponse.json({ success: true, message: `Adjustment ${existing.reference} marked as voided.` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH adjustment [id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update adjustment" }, { status: 500 });
  }
}

