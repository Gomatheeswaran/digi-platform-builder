import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { TenantApp } from "@/types";

// Public read-only endpoint for tenant storefronts.
// No platform JWT required — used by EcommerceRenderer to load products/categories.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const model = searchParams.get("model") || "products";
  const limit = Math.min(200, Number(searchParams.get("limit") || 100));
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const skip = (page - 1) * limit;

  const db = await getDb();
  const app = await db.collection<TenantApp>("apps").findOne({ _id: new ObjectId(id) });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collection = `app_data_${id}_${model}`;
  const [records, total] = await Promise.all([
    db.collection(collection).find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection(collection).countDocuments(),
  ]);

  return NextResponse.json({ records, total, page, limit });
}
