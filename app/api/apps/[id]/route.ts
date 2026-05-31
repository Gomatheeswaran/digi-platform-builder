import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, notFound, badRequest } from "@/lib/api-helpers";
import type { TenantApp } from "@/types";

type Params = { params: Promise<{ id: string }> };

async function getApp(db: Awaited<ReturnType<typeof getDb>>, id: string, userId: ObjectId) {
  if (!ObjectId.isValid(id)) return null;
  return db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId });
}

// GET /api/apps/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = await getDb();
  const app = await getApp(db, id, auth.user._id);
  if (!app) return notFound("App not found.");

  return NextResponse.json(app);
}

// PUT /api/apps/[id] — update name, description, status
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = await getDb();
  const app = await getApp(db, id, auth.user._id);
  if (!app) return notFound("App not found.");

  const body = await req.json();
  const update: Partial<TenantApp> = { updatedAt: new Date() };

  if (body.name !== undefined) update.name = body.name.trim();
  if (body.description !== undefined) update.description = body.description.trim();
  if (body.status !== undefined) {
    if (!["draft", "live", "paused"].includes(body.status)) {
      return badRequest("Invalid status.");
    }
    // Can only go live if they have a custom domain or we serve preview
    update.status = body.status;
  }

  await db.collection("apps").updateOne({ _id: app._id }, { $set: update });
  return NextResponse.json({ message: "App updated." });
}

// DELETE /api/apps/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = await getDb();
  const app = await getApp(db, id, auth.user._id);
  if (!app) return notFound("App not found.");

  // Delete the app and all its data
  await Promise.all([
    db.collection("apps").deleteOne({ _id: app._id }),
    db.collection("app_records").deleteMany({ appId: id }),
    db.collection("domains").deleteMany({ appId: app._id }),
  ]);

  return NextResponse.json({ message: "App deleted." });
}
