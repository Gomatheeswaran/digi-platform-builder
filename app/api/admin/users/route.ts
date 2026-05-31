import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";

// GET /api/admin/users?page=1&limit=20&search=
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Number(searchParams.get("limit") || 20));
  const search = searchParams.get("search") || "";

  const db = await getDb();
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
    : {};

  const [users, total] = await Promise.all([
    db.collection("platform_users")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .project({ password: 0 })
      .toArray(),
    db.collection("platform_users").countDocuments(filter),
  ]);

  // Attach app count per user
  const userIds = users.map((u) => u._id);
  const appCounts = await db.collection("apps")
    .aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ])
    .toArray();
  const appCountMap = Object.fromEntries(appCounts.map((a) => [String(a._id), a.count]));

  return NextResponse.json({
    users: users.map((u) => ({ ...u, appCount: appCountMap[String(u._id)] || 0 })),
    total,
    page,
    limit,
  });
}
