import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const storeId = searchParams.get("storeId");

    const orgStores = await prisma.store.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const storeIds = orgStores.map((s) => s.id);

    const where: any = {
      storeId: storeId && storeId !== "ALL" ? storeId : { in: storeIds },
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: adjustments });
  } catch (error: any) {
    console.error("GET adjustments error:", error);
    return NextResponse.json({ error: "Failed to fetch stock adjustments" }, { status: 500 });
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
    const { storeId, storageLocationId, reason, notes, items, status = "APPROVED" } = body;

    if (!storeId) {
      return NextResponse.json({ error: "Store is required" }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Adjustment reason is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required for adjustment" }, { status: 400 });
    }

    // Verify store belongs to organization
    const store = await prisma.store.findFirst({
      where: { id: storeId, organizationId },
    });
    if (!store) {
      return NextResponse.json({ error: "Selected store not found" }, { status: 404 });
    }

    // Generate reference number: ADJ-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.stockAdjustment.count({
      where: { storeId },
    });
    const reference = `ADJ-${year}-${String(count + 1).padStart(4, "0")}`;

    const isApproved = status === "APPROVED";

    const adjustment = await prisma.$transaction(async (tx) => {
      // 1. Create adjustment record
      const adj = await tx.stockAdjustment.create({
        data: {
          storeId,
          reference,
          reason: reason.trim(),
          notes: notes?.trim() || null,
          status: isApproved ? "APPROVED" : "DRAFT",
          approvedBy: isApproved ? userId : null,
          approvedAt: isApproved ? new Date() : null,
          createdBy: userId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              systemQuantity: Number(item.systemQuantity || 0),
              adjustedQuantity: Number(item.adjustedQuantity || 0),
              difference: Number(item.difference ?? (Number(item.adjustedQuantity || 0) - Number(item.systemQuantity || 0))),
              notes: item.notes?.trim() || null,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, purchaseCost: true } },
            },
          },
        },
      });

      // 2. If approved, apply inventory balances and stock movements
      if (isApproved) {
        for (const item of items) {
          const systemQty = Number(item.systemQuantity || 0);
          const adjQty = Number(item.adjustedQuantity || 0);
          const diff = adjQty - systemQty;

          const prod = await tx.product.findUnique({
            where: { id: item.productId },
            select: { purchaseCost: true },
          });
          const unitCost = prod ? Number(prod.purchaseCost) : 0;

          // Upsert store inventory balance
          await tx.inventoryBalance.upsert({
            where: {
              storeId_productId: {
                storeId,
                productId: item.productId,
              },
            },
            update: {
              quantity: adjQty,
            },
            create: {
              storeId,
              productId: item.productId,
              quantity: adjQty,
              averageCost: unitCost,
            },
          });

          // Create stock movement if there is a difference
          if (diff !== 0) {
            await tx.stockMovement.create({
              data: {
                storeId,
                productId: item.productId,
                type: diff > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
                quantity: Math.abs(diff),
                unitCost,
                referenceType: "STOCK_ADJUSTMENT",
                referenceId: adj.id,
                notes: `Adjustment #${reference}: ${reason}${item.notes ? ` - ${item.notes}` : ""}`,
                createdBy: userId,
              },
            });
          }

          // Optional: if storageLocationId is specified, also update storage balance
          if (storageLocationId) {
            await tx.storageInventoryBalance.upsert({
              where: {
                storageLocationId_productId: {
                  storageLocationId,
                  productId: item.productId,
                },
              },
              update: {
                quantity: adjQty,
              },
              create: {
                storageLocationId,
                productId: item.productId,
                quantity: adjQty,
                averageCost: unitCost,
              },
            });

            if (diff !== 0) {
              await tx.storageStockMovement.create({
                data: {
                  storageLocationId,
                  productId: item.productId,
                  type: diff > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
                  quantity: Math.abs(diff),
                  unitCost,
                  referenceType: "STOCK_ADJUSTMENT",
                  referenceId: adj.id,
                  notes: `Adjustment #${reference}: ${reason}${item.notes ? ` - ${item.notes}` : ""}`,
                  createdBy: userId,
                },
              });
            }
          }
        }
      }

      // 3. Audit log
      try {
        await tx.auditLog.create({
          data: {
            organizationId,
            storeId,
            actorId: userId,
            action: isApproved ? "STOCK_ADJUSTMENT_APPROVED" : "STOCK_ADJUSTMENT_CREATED",
            entityType: "STOCK_ADJUSTMENT",
            entityId: adj.id,
            newValues: {
              reference: adj.reference,
              reason: adj.reason,
              status: adj.status,
              itemsCount: items.length,
            },
          },
        });
      } catch (logErr) {
        console.warn("Audit log creation skipped:", logErr);
      }

      return adj;
    });

    return NextResponse.json({
      success: true,
      message: `Stock adjustment ${reference} ${isApproved ? "applied" : "saved as draft"} successfully`,
      data: adjustment,
    });
  } catch (error: any) {
    console.error("POST stock adjustment error:", error);
    return NextResponse.json({ error: error.message || "Failed to create stock adjustment" }, { status: 500 });
  }
}

