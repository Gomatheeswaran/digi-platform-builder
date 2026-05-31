import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";
import { notFound, badRequest } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/apps/[id] — force-update status or plan
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const body = await req.json();
  const db = await getDb();

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) {
    if (!["draft", "live", "paused"].includes(body.status)) return badRequest("Invalid status.");
    update.status = body.status;
  }
  if (body.plan !== undefined) {
    if (!["free", "hosted"].includes(body.plan)) return badRequest("Invalid plan.");
    update.plan = body.plan;
  }

  const result = await db.collection("apps").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  if (result.matchedCount === 0) return notFound("App not found.");
  return NextResponse.json({ message: "App updated." });
}

// DELETE /api/admin/apps/[id] — force delete any app
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const db = await getDb();
  await Promise.all([
    db.collection("apps").deleteOne({ _id: new ObjectId(id) }),
    db.collection("domains").deleteMany({ appId: new ObjectId(id) }),
  ]);

  return NextResponse.json({ message: "App deleted." });
}
