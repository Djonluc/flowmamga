import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Shield, Users, BookOpen, AlertTriangle, Activity } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const [userCount, comicCount, reportCount, recentAuditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.comic.count(),
    // Assuming we'll add a Report model later
    Promise.resolve(0),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: "desc" },
      include: {
        admin: {
          select: { name: true, image: true },
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="text-red-500" size={40} />
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-neutral-400 mt-1">Platform moderation and management</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="text-blue-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Total Users</span>
            </div>
            <p className="text-3xl font-bold">{userCount.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BookOpen className="text-purple-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Total Comics</span>
            </div>
            <p className="text-3xl font-bold">{comicCount.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Pending Reports</span>
            </div>
            <p className="text-3xl font-bold">{reportCount}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="text-green-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Active Today</span>
            </div>
            <p className="text-3xl font-bold">--</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="bg-neutral-900 hover:bg-neutral-800 rounded-xl p-6 border border-white/5 transition-colors group"
          >
            <Users className="text-blue-400 mb-3" size={32} />
            <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">User Management</h3>
            <p className="text-sm text-neutral-400 mt-1">View, suspend, and manage users</p>
          </a>

          <a
            href="/admin/content"
            className="bg-neutral-900 hover:bg-neutral-800 rounded-xl p-6 border border-white/5 transition-colors group"
          >
            <BookOpen className="text-purple-400 mb-3" size={32} />
            <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">Content Moderation</h3>
            <p className="text-sm text-neutral-400 mt-1">Feature, hide, or remove content</p>
          </a>

          <a
            href="/admin/audit"
            className="bg-neutral-900 hover:bg-neutral-800 rounded-xl p-6 border border-white/5 transition-colors group"
          >
            <Activity className="text-green-400 mb-3" size={32} />
            <h3 className="font-bold text-lg group-hover:text-green-400 transition-colors">Audit Logs</h3>
            <p className="text-sm text-neutral-400 mt-1">View all administrative actions</p>
          </a>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5 space-y-4">
          <h2 className="text-xl font-bold">Recent Admin Actions</h2>
          
          {recentAuditLogs.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No recent actions</p>
          ) : (
            <div className="space-y-2">
              {recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
                      {log.admin.image && (
                        <img src={log.admin.image} alt={log.admin.name || "Admin"} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{log.admin.name}</span>{" "}
                        <span className="text-neutral-400">{log.action}</span>{" "}
                        <span className="text-blue-400">{log.targetType}</span>
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-600 font-mono">{log.targetId.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
