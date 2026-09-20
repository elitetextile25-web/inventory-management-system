import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  lineTotal: z.coerce.number().min(0),
  productName: z.string(),
  productSku: z.string(),
  unitCost: z.coerce.number().default(0),
});

const CreateSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  saleDate: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "PARTIALLY_PAID", "PAID", "COMPLETED"]).default("CONFIRMED"),
  subtotal: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  grandTotal: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0).default(0),
  dueAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "BANK", "CARD", "MOBILE_BANKING", "OTHER"]).default("CASH"),
  notes: z.string().optional().nullable(),
  items: z.array(SaleItemSchema).min(1, "At least one item is required"),
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
    const validated = CreateSaleSchema.parse(body);

    // Ensure invoice number uniqueness
    let invNumber = validated.invoiceNumber;
    const existing = await prisma.sales.findUnique({
      where: {
        storeId_invoiceNumber: {
          storeId,
          invoiceNumber: invNumber,
        },
      },
    });

    if (existing) {
      invNumber = `${invNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Determine correct status based on payment
    let saleStatus = validated.status;
    if (saleStatus !== "DRAFT") {
      if (validated.paidAmount >= validated.grandTotal && validated.grandTotal > 0) {
        saleStatus = "PAID";
      } else if (validated.paidAmount > 0) {
        saleStatus = "PARTIALLY_PAID";
      } else {
        saleStatus = "CONFIRMED";
      }
    }

    // Create Sale, Items, and Payment in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      const createdSale = await tx.sales.create({
        data: {
          storeId,
          customerId: validated.customerId || null,
          salespersonId: userId || null,
          invoiceNumber: invNumber,
          saleDate: validated.saleDate ? new Date(validated.saleDate) : new Date(),
          channel: "INVOICE",
          status: saleStatus,
          subtotal: validated.subtotal,
          discountAmount: validated.discountAmount,
          taxAmount: validated.taxAmount,
          grandTotal: validated.grandTotal,
          paidAmount: validated.paidAmount,
          dueAmount: validated.dueAmount,
          notes: validated.notes || null,
          createdBy: userId || null,
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
              unitCost: item.unitCost,
              productName: item.productName,
              productSku: item.productSku,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Record payment if paidAmount > 0
      if (validated.paidAmount > 0) {
        await tx.payment.create({
          data: {
            organizationId,
            storeId,
            customerId: validated.customerId || null,
            saleId: createdSale.id,
            type: "SALE_PAYMENT",
            method: validated.paymentMethod,
            amount: validated.paidAmount,
            reference: invNumber,
            status: "COMPLETED",
            createdBy: userId || null,
          },
        });
      }

      // Update Inventory Balances & Stock Movements if not draft
      if (saleStatus !== "DRAFT") {
        for (const item of validated.items) {
          await tx.inventoryBalance.upsert({
            where: {
              storeId_productId: {
                storeId,
                productId: item.productId,
              },
            },
            update: {
              quantity: { decrement: item.quantity },
            },
            create: {
              storeId,
              productId: item.productId,
              quantity: -item.quantity,
              averageCost: item.unitCost,
            },
          });

          await tx.stockMovement.create({
            data: {
              storeId,
              productId: item.productId,
              type: "SALE",
              quantity: item.quantity,
              unitCost: item.unitCost,
              referenceType: "SALE",
              referenceId: createdSale.id,
              notes: `Invoice ${invNumber} (${item.quantity} units)`,
              createdBy: userId || null,
            },
          });
        }
      }

      return createdSale;
    });

    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    console.error("POST sale error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
