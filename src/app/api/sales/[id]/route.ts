import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeData } from "@/lib/utils";

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

    // Search by ID or by invoiceNumber
    const sale = await prisma.sales.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id },
        ],
      },
      include: {
        customer: true,
        store: true,
        salesperson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: { unit: true },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeData(sale) });
  } catch (error: any) {
    console.error("GET sale by ID error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sale details" },
      { status: 500 }
    );
  }
}
