import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const orgId = (session.user as any)?.organizationId;
  let org = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true },
      })
    : null;

  if (!org) {
    org = await prisma.organization.findFirst({
      select: { id: true, name: true },
    });
  }

  return (
    <DashboardLayout user={session.user} organizationName={org?.name || "FabricPro"}>
      {children}
    </DashboardLayout>
  );
}
