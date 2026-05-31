import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";
import { notFound, badRequest } from "@/lib/api-helpers";

// GET /api/admin/domains?page=1&verified=
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 20;
  const verified = searchParams.get("verified");

  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (verified !== null) filter.verified = verified === "true";

  const [domains, total] = await Promise.all([
    db.collection("domains")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("domains").countDocuments(filter),
  ]);

  // Attach app name and user email
  const appIds = domains.map((d) => d.appId).filter(Boolean);
  const userIds = domains.map((d) => d.userId).filter(Boolean);

  const [apps, users] = await Promise.all([
    db.collection("apps").find({ _id: { $in: appIds } }).project({ name: 1, slug: 1 }).toArray(),
    db.collection("platform_users").find({ _id: { $in: userIds } }).project({ email: 1, name: 1 }).toArray(),
  ]);

  const appMap = Object.fromEntries(apps.map((a) => [String(a._id), a]));
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  return NextResponse.json({
    domains: domains.map((d) => ({
      ...d,
      app: appMap[String(d.appId)] || null,
      owner: userMap[String(d.userId)] || null,
    })),
    total,
    page,
    limit,
  });
}

// POST /api/admin/domains — manually verify a domain
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { domainId } = await req.json();
  if (!domainId || !ObjectId.isValid(domainId)) return badRequest("Invalid domainId.");

  const db = await getDb();
  const domain = await db.collection("domains").findOne({ _id: new ObjectId(domainId) });
  if (!domain) return notFound("Domain not found.");

  await Promise.all([
    db.collection("domains").updateOne(
      { _id: domain._id },
      { $set: { verified: true, sslStatus: "active", updatedAt: new Date() } }
    ),
    db.collection("apps").updateOne(
      { _id: domain.appId },
      { $set: { domainVerified: true, sslStatus: "active", status: "live", updatedAt: new Date() } }
    ),
  ]);

  return NextResponse.json({ message: "Domain manually verified." });
}
