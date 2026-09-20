export const metadata = { title: "Audit Log — FabricPro" };
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { Activity } from "lucide-react";

export default async function AuditPage({
  searchParams,
}: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;
  const sp = await searchParams;

  const page = Number(sp.page ?? 1);
  const pageSize = 30;
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip, take: pageSize,
    }),
    prisma.auditLog.count({ where: { organizationId } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6" />Audit Log</h1>
        <p className="text-sm text-muted-foreground">{total} events recorded</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              {["Timestamp","Actor","Action","Entity","Store"].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No audit events yet</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-xs">{log.actor?.name ?? "System"}</p>
                    <p className="text-xs text-muted-foreground">{log.actor?.email}</p>
                  </td>
                  <td className="px-4 py-2.5"><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{log.action}</span></td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className="text-muted-foreground">{log.entityType}</span>
                    {log.entityId && <span className="font-mono text-xs ml-1 text-foreground/60">#{log.entityId.slice(0,8)}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.storeId?.slice(0,8) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && <Link href={`?page=${page - 1}`} className="text-sm text-primary hover:underline">Previous</Link>}
              {page < totalPages && <Link href={`?page=${page + 1}`} className="text-sm text-primary hover:underline">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
