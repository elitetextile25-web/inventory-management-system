import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PurchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0, "Unit cost cannot be negative"),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  lineTotal: z.coerce.number().min(0),
  productName: z.string(),
  productSku: z.string(),
});

const CreatePurchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  orderNumber: z.string().min(1, "Order number is required"),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "ORDERED", "RECEIVED", "PARTIALLY_PAID", "PAID"]).default("ORDERED"),
  subtotal: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  shippingCost: z.coerce.number().min(0).default(0),
  grandTotal: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0).default(0),
  dueAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "BANK", "CARD", "MOBILE_BANKING", "OTHER"]).default("BANK"),
  notes: z.string().optional().nullable(),
  items: z.array(PurchaseItemSchema).min(1, "At least one item is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;
    let storeId = (session?.user as any)?.storeId;
    const userId = session?.user?.id;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!storeId) {
      const defaultStore = await prisma.store.findFirst({
        where: { organizationId, isActive: true },
        select: { id: true },
      });
      storeId = defaultStore?.id;
    }

    if (!storeId) {
      return NextResponse.json({ error: "No active store found" }, { status: 400 });
    }

    const body = await req.json();
    const validated = CreatePurchaseSchema.parse(body);

    let orderNum = validated.orderNumber;
    const existing = await prisma.purchaseOrder.findUnique({
      where: {
        storeId_orderNumber: {
          storeId,
          orderNumber: orderNum,
        },
      },
    });

    if (existing) {
      orderNum = `${orderNum}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Calculate authoritative totals server-side
    const calculatedSubtotal = validated.items.reduce(
      (sum, item) => sum + Math.max(0, item.quantity * item.unitCost - (item.discountAmount || 0)),
      0
    );
    const calculatedGrandTotal = Math.max(
      0,
      calculatedSubtotal - (validated.discountAmount || 0) + (validated.taxAmount || 0) + (validated.shippingCost || 0)
    );
    const calculatedDueAmount = Math.max(0, calculatedGrandTotal - (validated.paidAmount || 0));

    let purchaseStatus = validated.status;
    const isGoodsReceived = validated.status === "RECEIVED" || purchaseStatus === "RECEIVED";

    if (purchaseStatus !== "DRAFT") {
      if (validated.paidAmount >= calculatedGrandTotal && calculatedGrandTotal > 0) {
        purchaseStatus = "PAID";
      } else if (validated.paidAmount > 0) {
        purchaseStatus = "PARTIALLY_PAID";
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.purchaseOrder.create({
        data: {
          storeId,
          supplierId: validated.supplierId,
          orderNumber: orderNum,
          orderDate: validated.orderDate ? new Date(validated.orderDate) : new Date(),
          expectedDate: validated.expectedDate ? new Date(validated.expectedDate) : null,
          status: purchaseStatus as any,
          subtotal: calculatedSubtotal,
          discountAmount: validated.discountAmount,
          taxAmount: validated.taxAmount,
          shippingCost: validated.shippingCost,
          grandTotal: calculatedGrandTotal,
          paidAmount: validated.paidAmount,
          dueAmount: calculatedDueAmount,
          notes: validated.notes || null,
          createdBy: userId || null,
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              discountAmount: item.discountAmount,
              taxAmount: item.taxAmount,
              lineTotal: Math.max(0, item.quantity * item.unitCost - (item.discountAmount || 0)),
              productName: item.productName,
              productSku: item.productSku,
            })),
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      if (validated.paidAmount > 0) {
        await tx.payment.create({
          data: {
            organizationId,
            storeId,
            supplierId: validated.supplierId,
            purchaseOrderId: createdOrder.id,
            type: "PURCHASE_PAYMENT",
            method: validated.paymentMethod,
            amount: validated.paidAmount,
            reference: orderNum,
            status: "COMPLETED",
            createdBy: userId || null,
          },
        });
      }

      // If received or paid in full, increment stock & create stock movement
      if (isGoodsReceived || purchaseStatus === "PAID") {
        for (const item of validated.items) {
          await tx.inventoryBalance.upsert({
            where: {
              storeId_productId: {
                storeId,
                productId: item.productId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              storeId,
              productId: item.productId,
              quantity: item.quantity,
              averageCost: item.unitCost,
            },
          });

          await tx.stockMovement.create({
            data: {
              storeId,
              productId: item.productId,
              type: "PURCHASE_RECEIPT",
              quantity: item.quantity,
              unitCost: item.unitCost,
              referenceType: "PURCHASE",
              referenceId: createdOrder.id,
              notes: `PO ${orderNum} received (${item.quantity} units)`,
              createdBy: userId || null,
            },
          });
        }
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("POST purchase error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
