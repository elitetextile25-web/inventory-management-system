import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const TransferItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

const CreateTransferSchema = z.object({
  sourceLocationId: z.string().min(1, "Source storage location is required"),
  destinationLocationId: z.string().min(1, "Destination storage location is required"),
  transferDate: z.string().optional(),
  status: z.enum(["DRAFT", "IN_TRANSIT", "COMPLETED"]).default("COMPLETED"),
  notes: z.string().optional().nullable(),
  items: z.array(TransferItemSchema).min(1, "At least one product item is required"),
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
    const source = searchParams.get("source");
    const destination = searchParams.get("destination");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { transferNumber: { contains: search, mode: "insensitive" } },
        { sourceLocation: { name: { contains: search, mode: "insensitive" } } },
        { destinationLocation: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (source && source !== "ALL") {
      where.sourceLocationId = source;
    }

    if (destination && destination !== "ALL") {
      where.destinationLocationId = destination;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        orderBy: { transferDate: "desc" },
        skip,
        take: limit,
        include: {
          sourceLocation: {
            select: { id: true, name: true, code: true },
          },
          destinationLocation: {
            select: { id: true, name: true, code: true },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unit: { select: { abbreviation: true } },
                },
              },
            },
          },
        },
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    return NextResponse.json({
      data: transfers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET stock transfers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stock transfers" },
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
    const validated = CreateTransferSchema.parse(body);

    if (validated.sourceLocationId === validated.destinationLocationId) {
      return NextResponse.json(
        { error: "Source and destination storage locations cannot be the same." },
        { status: 400 }
      );
    }

    // Verify both locations belong to the organization
    const [sourceLoc, destLoc] = await Promise.all([
      prisma.storageLocation.findFirst({
        where: { id: validated.sourceLocationId, organizationId },
      }),
      prisma.storageLocation.findFirst({
        where: { id: validated.destinationLocationId, organizationId },
      }),
    ]);

    if (!sourceLoc) {
      return NextResponse.json({ error: "Source storage location not found" }, { status: 404 });
    }
    if (!destLoc) {
      return NextResponse.json({ error: "Destination storage location not found" }, { status: 404 });
    }

    // Auto-generate transfer number TRF-YYYY-0001
    const year = new Date().getFullYear();
    const transferCount = await prisma.stockTransfer.count({
      where: { organizationId },
    });
    const transferNumber = `TRF-${year}-${String(transferCount + 1).padStart(4, "0")}`;

    const isCompleted = validated.status === "COMPLETED";

    const transfer = await prisma.$transaction(async (tx) => {
      // If completed, verify stock availability at source location
      if (isCompleted) {
        for (const item of validated.items) {
          const balance = await tx.storageInventoryBalance.findUnique({
            where: {
              storageLocationId_productId: {
                storageLocationId: validated.sourceLocationId,
                productId: item.productId,
              },
            },
          });

          const currentStock = balance ? Number(balance.quantity) : 0;
          if (currentStock < item.quantity) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { name: true, sku: true },
            });
            throw new Error(
              `Insufficient stock for "${product?.name || item.productId}" (SKU: ${product?.sku || "N/A"}) at source location "${sourceLoc.name}". Available: ${currentStock}, Requested: ${item.quantity}.`
            );
          }
        }
      }

      // Create StockTransfer
      const createdTransfer = await tx.stockTransfer.create({
        data: {
          organizationId,
          transferNumber,
          sourceLocationId: validated.sourceLocationId,
          destinationLocationId: validated.destinationLocationId,
          transferDate: validated.transferDate ? new Date(validated.transferDate) : new Date(),
          status: validated.status as any,
          notes: validated.notes || null,
          createdBy: userId || null,
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              notes: item.notes || null,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
          sourceLocation: true,
          destinationLocation: true,
        },
      });

      // Update inventory balances if COMPLETED
      if (isCompleted) {
        for (const item of validated.items) {
          // 1. Decrement source location
          await tx.storageInventoryBalance.update({
            where: {
              storageLocationId_productId: {
                storageLocationId: validated.sourceLocationId,
                productId: item.productId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // 2. Log TRANSFER_OUT stock movement
          await tx.storageStockMovement.create({
            data: {
              storageLocationId: validated.sourceLocationId,
              productId: item.productId,
              type: "TRANSFER_OUT",
              quantity: -item.quantity,
              unitCost: item.unitCost,
              referenceType: "TRANSFER",
              referenceId: createdTransfer.id,
              notes: `Stock Transfer #${transferNumber} to ${destLoc.name}`,
              createdBy: userId || null,
            },
          });

          // 3. Increment destination location
          await tx.storageInventoryBalance.upsert({
            where: {
              storageLocationId_productId: {
                storageLocationId: validated.destinationLocationId,
                productId: item.productId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              storageLocationId: validated.destinationLocationId,
              productId: item.productId,
              quantity: item.quantity,
              averageCost: item.unitCost,
            },
          });

          // 4. Log TRANSFER_IN stock movement
          await tx.storageStockMovement.create({
            data: {
              storageLocationId: validated.destinationLocationId,
              productId: item.productId,
              type: "TRANSFER_IN",
              quantity: item.quantity,
              unitCost: item.unitCost,
              referenceType: "TRANSFER",
              referenceId: createdTransfer.id,
              notes: `Stock Transfer #${transferNumber} from ${sourceLoc.name}`,
              createdBy: userId || null,
            },
          });
        }
      }

      return createdTransfer;
    });

    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: userId || null,
          action: "CREATE",
          entityType: "STOCK_TRANSFER",
          entityId: transfer.id,
          newValues: {
            transferNumber: transfer.transferNumber,
            from: sourceLoc.name,
            to: destLoc.name,
            itemsCount: validated.items.length,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    return NextResponse.json({ success: true, data: transfer }, { status: 201 });
  } catch (error: any) {
    console.error("POST stock transfer error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create stock transfer" },
      { status: 400 }
    );
  }
}

