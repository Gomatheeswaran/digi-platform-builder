import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";

// GET /api/admin/apps?page=1&limit=20&search=&plan=&status=
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Number(searchParams.get("limit") || 20));
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";
  const status = searchParams.get("status") || "";

  const db = await getDb();

  const filter: Record<string, unknown> = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (plan) filter.plan = plan;
  if (status) filter.status = status;

  const [apps, total] = await Promise.all([
    db.collection("apps")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .project({ config: 0 }) // omit large config object
      .toArray(),
    db.collection("apps").countDocuments(filter),
  ]);

  // Attach owner email
  const userIds = [...new Set(apps.map((a) => a.userId))];
  const users = await db.collection("platform_users")
    .find({ _id: { $in: userIds } })
    .project({ email: 1, name: 1 })
    .toArray();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  return NextResponse.json({
    apps: apps.map((a) => ({ ...a, owner: userMap[String(a.userId)] || null })),
    total,
    page,
    limit,
  });
}
