import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";

// GET /api/admin/tenants?page=1&limit=20&search=&status=active|suspended
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Number(searchParams.get("limit") || 20));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || ""; // "active" | "suspended" | ""

  const db = await getDb();

  const filter: Record<string, unknown> = { role: "tenant_admin" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (status === "suspended") filter.suspended = true;
  if (status === "active") filter.$and = [
    ...(filter.$and as unknown[] || []),
    { $or: [{ suspended: { $exists: false } }, { suspended: false }] },
  ];

  const [users, total] = await Promise.all([
    db.collection("platform_users")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .project({ password: 0, passwordHash: 0 })
      .toArray(),
    db.collection("platform_users").countDocuments(filter),
  ]);

  // Attach app count per tenant
  const userIds = users.map((u) => u._id);
  const appCounts = await db.collection("apps")
    .aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 }, hosted: { $sum: { $cond: [{ $eq: ["$plan", "hosted"] }, 1, 0] } } } },
    ])
    .toArray();
  const appMap = Object.fromEntries(appCounts.map((a) => [String(a._id), { count: a.count, hosted: a.hosted }]));

  return NextResponse.json({
    tenants: users.map((u) => ({
      ...u,
      appCount: appMap[String(u._id)]?.count || 0,
      hostedApps: appMap[String(u._id)]?.hosted || 0,
      atLimit: (appMap[String(u._id)]?.count || 0) >= 3,
    })),
    total,
    page,
    limit,
  });
}
