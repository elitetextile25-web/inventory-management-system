import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password, businessName, phone } = parsed.data;

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create organization, default store, roles, and user inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Organization
      const org = await tx.organization.create({
        data: {
          name: businessName.trim(),
          phone: phone?.trim() || null,
          email: email.toLowerCase().trim(),
          currency: "BDT",
          timezone: "Asia/Dhaka",
          locale: "en-BD",
        },
      });

      // 2. Default Store / Branch
      const store = await tx.store.create({
        data: {
          organizationId: org.id,
          name: `${businessName.trim()} Main Branch`,
          isDefault: true,
          isActive: true,
        },
      });

      // 3. Admin / Owner Role
      const adminRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: "Owner / Admin",
          description: "Full system access to all store operations, finance, and settings",
          isSystem: true,
        },
      });

      // Link any existing permissions to this admin role
      const allPermissions = await tx.permission.findMany();
      if (allPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: allPermissions.map((perm) => ({
            roleId: adminRole.id,
            permissionId: perm.id,
          })),
        });
      }

      // Also create Manager and Cashier roles for this organization for future staff invites
      await tx.role.createMany({
        data: [
          {
            organizationId: org.id,
            name: "Store Manager",
            description: "Manage inventory, purchases, sales, and generate reports",
            isSystem: true,
          },
          {
            organizationId: org.id,
            name: "Cashier",
            description: "POS billing, sales receipts, customer lookup",
            isSystem: true,
          },
        ],
      });

      // 4. Create User
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          isActive: true,
        },
      });

      // 5. Assign User to Admin Role & Store
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      await tx.userStore.create({
        data: {
          userId: user.id,
          storeId: store.id,
        },
      });

      // 6. Create Default Cash Register
      await tx.cashAccount.create({
        data: {
          storeId: store.id,
          name: "Main Cash Register",
          type: "CASH",
          openingBalance: 0,
          currentBalance: 0,
          isDefault: true,
          isActive: true,
        },
      });

      // 7. Initial Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          storeId: store.id,
          actorId: user.id,
          action: "BUSINESS_REGISTERED",
          entityType: "ORGANIZATION",
          entityId: org.id,
          newValues: {
            organization: org.name,
            creator: user.name,
            email: user.email,
          },
        },
      });

      return { user, org, store };
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful! You can now sign in.",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organization: result.org.name,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again later." },
      { status: 500 }
    );
  }
}
