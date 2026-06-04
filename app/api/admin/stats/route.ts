import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";

// GET /api/admin/stats
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    suspendedUsers,
    activeToday,
    totalApps,
    hostedApps,
    totalDomains,
    verifiedDomains,
    totalRevenue,
    recentUsers,
    appsByTemplate,
  ] = await Promise.all([
    db.collection("platform_users").countDocuments({ role: "tenant_admin" }),
    db.collection("platform_users").countDocuments({ suspended: true }),
    db.collection("platform_users").countDocuments({ lastLoginAt: { $gte: yesterday } }),
    db.collection("apps").countDocuments(),
    db.collection("apps").countDocuments({ plan: "hosted" }),
    db.collection("domains").countDocuments(),
    db.collection("domains").countDocuments({ verified: true }),
    db.collection("payments")
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray(),
    db.collection("platform_users")
      .find({ role: "tenant_admin" })
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ password: 0, passwordHash: 0 })
      .toArray(),
    db.collection("apps")
      .aggregate([{ $group: { _id: "$template", count: { $sum: 1 } } }])
      .toArray(),
  ]);

  return NextResponse.json({
    totalUsers,
    suspendedUsers,
    activeUsers: activeToday,
    totalApps,
    hostedApps,
    freeApps: totalApps - hostedApps,
    totalDomains,
    verifiedDomains,
    totalRevenuePaise: totalRevenue[0]?.total || 0,
    recentUsers,
    appsByTemplate: Object.fromEntries(appsByTemplate.map((t) => [t._id, t.count])),
  });
}
