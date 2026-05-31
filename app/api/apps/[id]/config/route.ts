import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, notFound } from "@/lib/api-helpers";
import type { TenantApp, AppConfig } from "@/types";

type Params = { params: Promise<{ id: string }> };

// GET /api/apps/[id]/config
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });

  if (!app) return notFound("App not found.");
  return NextResponse.json(app.config);
}

// PUT /api/apps/[id]/config — save full config JSON
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });

  if (!app) return notFound("App not found.");

  const config: AppConfig = await req.json();

  await db.collection("apps").updateOne(
    { _id: app._id },
    { $set: { config, updatedAt: new Date() } }
  );

  return NextResponse.json({ message: "Config saved." });
}
