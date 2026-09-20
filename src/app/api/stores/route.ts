import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId;

    const where: any = { isActive: true };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const stores = await prisma.store.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ data: stores });
  } catch (error: any) {
    console.error("GET stores error:", error);
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}
