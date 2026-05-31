import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";

// GET /api/admin/stats
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();

  const [
    totalUsers,
    totalApps,
    hostedApps,
    totalDomains,
    verifiedDomains,
    totalRevenue,
    recentUsers,
  ] = await Promise.all([
    db.collection("platform_users").countDocuments(),
    db.collection("apps").countDocuments(),
    db.collection("apps").countDocuments({ plan: "hosted" }),
    db.collection("domains").countDocuments(),
    db.collection("domains").countDocuments({ verified: true }),
    db.collection("payments")
      .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray(),
    db.collection("platform_users")
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ password: 0 })
      .toArray(),
  ]);

  return NextResponse.json({
    totalUsers,
    totalApps,
    hostedApps,
    freeApps: totalApps - hostedApps,
    totalDomains,
    verifiedDomains,
    totalRevenuePaise: totalRevenue[0]?.total || 0,
    recentUsers,
  });
}
