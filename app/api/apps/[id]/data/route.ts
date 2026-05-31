import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, notFound, badRequest } from "@/lib/api-helpers";
import type { TenantApp } from "@/types";

type Params = { params: Promise<{ id: string }> };

// GET /api/apps/[id]/data?model=products&page=1&limit=20
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const { searchParams } = req.nextUrl;
  const model = searchParams.get("model") || "default";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  const collection = `app_data_${id}_${model}`;
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    db.collection(collection).find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection(collection).countDocuments(),
  ]);

  return NextResponse.json({ records, total, page, limit });
}

// POST /api/apps/[id]/data?model=products
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const { searchParams } = req.nextUrl;
  const model = searchParams.get("model") || "default";

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  const modelDef = app.config.dataModels.find((m) => m.slug === model);
  if (!modelDef?.allowCreate) return badRequest("Creating records is not allowed for this model.");

  const data = await req.json();
  const now = new Date();

  const collection = `app_data_${id}_${model}`;
  const result = await db.collection(collection).insertOne({
    ...data,
    appId: id,
    modelSlug: model,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
