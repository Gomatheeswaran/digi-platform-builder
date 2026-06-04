import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";
import { notFound, badRequest } from "@/lib/api-helpers";
import type { PlatformUser } from "@/types";

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id] — update role or isEmailVerified
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const body = await req.json();
  const db = await getDb();

  const update: Partial<PlatformUser> & { updatedAt: Date } = { updatedAt: new Date() };

  if (body.role !== undefined) {
    if (!["super_admin", "tenant_admin"].includes(body.role)) return badRequest("Invalid role.");
    if (String(auth.user._id) === id && body.role !== "super_admin") {
      return badRequest("Cannot demote your own super admin account.");
    }
    update.role = body.role;
  }

  if (body.isEmailVerified !== undefined) {
    update.isEmailVerified = Boolean(body.isEmailVerified);
  }

  if (body.plan !== undefined) {
    if (!["free", "starter", "pro"].includes(body.plan)) return badRequest("Invalid plan.");
    update.plan = body.plan;
  }

  if (body.suspended !== undefined) {
    if (String(auth.user._id) === id) return badRequest("Cannot suspend your own account.");
    update.suspended = Boolean(body.suspended);
  }

  const result = await db.collection("platform_users").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  if (result.matchedCount === 0) return notFound("User not found.");
  return NextResponse.json({ message: "User updated." });
}

// DELETE /api/admin/users/[id] — delete user and all their apps
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  if (String(auth.user._id) === id) {
    return badRequest("Cannot delete your own account.");
  }

  const db = await getDb();
  const userId = new ObjectId(id);

  // Remove all apps, domains, then user
  const apps = await db.collection("apps").find({ userId }).project({ _id: 1 }).toArray();
  await Promise.all([
    db.collection("platform_users").deleteOne({ _id: userId }),
    db.collection("apps").deleteMany({ userId }),
    db.collection("domains").deleteMany({ userId }),
    ...apps.map((a) =>
      // Drop all data collections for this app (best-effort)
      db.collection(`app_data_${a._id}_*`)
        .drop()
        .catch(() => null)
    ),
  ]);

  return NextResponse.json({ message: "User deleted." });
}
