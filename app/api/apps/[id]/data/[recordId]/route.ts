import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, notFound, badRequest } from "@/lib/api-helpers";
import type { TenantApp } from "@/types";

type Params = { params: Promise<{ id: string; recordId: string }> };

// PUT /api/apps/[id]/data/[recordId]?model=products
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id, recordId } = await params;
  if (!ObjectId.isValid(id) || !ObjectId.isValid(recordId)) return notFound();

  const model = req.nextUrl.searchParams.get("model") || "default";

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  const modelDef = app.config.dataModels.find((m) => m.slug === model);
  if (!modelDef?.allowEdit) return badRequest("Editing records is not allowed for this model.");

  const data = await req.json();
  delete data._id;
  delete data.appId;
  delete data.modelSlug;
  delete data.createdAt;

  const collection = `app_data_${id}_${model}`;
  const result = await db.collection(collection).updateOne(
    { _id: new ObjectId(recordId) },
    { $set: { ...data, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) return notFound("Record not found.");
  return NextResponse.json({ message: "Record updated." });
}

// DELETE /api/apps/[id]/data/[recordId]?model=products
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id, recordId } = await params;
  if (!ObjectId.isValid(id) || !ObjectId.isValid(recordId)) return notFound();

  const model = req.nextUrl.searchParams.get("model") || "default";

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  const modelDef = app.config.dataModels.find((m) => m.slug === model);
  if (!modelDef?.allowDelete) return badRequest("Deleting records is not allowed for this model.");

  const collection = `app_data_${id}_${model}`;
  const result = await db.collection(collection).deleteOne({ _id: new ObjectId(recordId) });

  if (result.deletedCount === 0) return notFound("Record not found.");
  return NextResponse.json({ message: "Record deleted." });
}
