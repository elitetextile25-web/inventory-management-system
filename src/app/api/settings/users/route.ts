import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: orgId },
      include: { userRoles: { include: { role: true } }, userStores: { include: { store: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany({
      where: { organizationId: orgId },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ users, roles });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const body = await req.json();

  if (body.action === "CREATE_USER") {
    const { name, email, password, roleIds, storeIds } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { organizationId: orgId, email } });
    if (existing) return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        organizationId: orgId,
        name,
        email,
        passwordHash,
        userRoles: roleIds?.length
          ? { create: roleIds.map((roleId: string) => ({ roleId })) }
          : undefined,
        userStores: storeIds?.length
          ? { create: storeIds.map((storeId: string) => ({ storeId })) }
          : undefined,
      },
    });
    return NextResponse.json(user, { status: 201 });
  }

  if (body.action === "TOGGLE_ACTIVE") {
    const user = await prisma.user.update({
      where: { id: body.userId },
      data: { isActive: body.isActive },
    });
    return NextResponse.json(user);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
