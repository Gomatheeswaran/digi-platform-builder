import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";
import { notFound, badRequest } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/tenants/[id] — full tenant profile + apps + payments
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const db = await getDb();
  const userId = new ObjectId(id);

  const [user, apps, payments] = await Promise.all([
    db.collection("platform_users").findOne(
      { _id: userId },
      { projection: { password: 0, passwordHash: 0 } }
    ),
    db.collection("apps")
      .find({ userId })
      .sort({ createdAt: -1 })
      .project({ config: 0 })
      .toArray(),
    db.collection("payments")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  if (!user) return notFound("Tenant not found.");

  // Count data records per app
  const appIds = apps.map((a) => String(a._id));
  const recordCounts: Record<string, number> = {};
  await Promise.all(
    appIds.map(async (appId) => {
      // Count products records as a representative metric
      try {
        recordCounts[appId] = await db.collection(`app_data_${appId}_products`).countDocuments();
      } catch {
        recordCounts[appId] = 0;
      }
    })
  );

  return NextResponse.json({
    tenant: user,
    apps: apps.map((a) => ({ ...a, productCount: recordCounts[String(a._id)] || 0 })),
    payments,
    stats: {
      totalApps: apps.length,
      liveApps: apps.filter((a) => a.status === "live").length,
      hostedApps: apps.filter((a) => a.plan === "hosted").length,
      totalSpentPaise: payments.reduce((s: number, p: { amount?: number }) => s + (p.amount || 0), 0),
    },
  });
}

// PUT /api/admin/tenants/[id] — suspend / unsuspend
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  if (String(auth.user._id) === id) return badRequest("Cannot suspend your own account.");

  const { suspended } = await req.json();
  if (typeof suspended !== "boolean") return badRequest("suspended must be a boolean.");

  const db = await getDb();
  const result = await db.collection("platform_users").updateOne(
    { _id: new ObjectId(id) },
    { $set: { suspended, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) return notFound("Tenant not found.");
  return NextResponse.json({ message: suspended ? "Account suspended." : "Account reactivated." });
}
