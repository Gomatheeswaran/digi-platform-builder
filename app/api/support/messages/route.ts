import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

// GET /api/support/messages
// Tenant → own thread. Admin → ?tenantId=<id>
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const isAdmin = auth.user.role === "super_admin";

  let tenantOid: ObjectId;
  if (isAdmin) {
    const tid = searchParams.get("tenantId");
    if (!tid) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    tenantOid = new ObjectId(tid);
  } else {
    tenantOid = auth.user._id;
  }

  const messages = await db
    .collection("support_messages")
    .find({ tenantId: tenantOid })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();

  // Mark inbound messages as read by current viewer
  const markRead = isAdmin
    ? { tenantId: tenantOid, fromAdmin: false, read: false }
    : { tenantId: tenantOid, fromAdmin: true, read: false };

  await db.collection("support_messages").updateMany(markRead, { $set: { read: true } });

  return NextResponse.json({ messages });
}

// POST /api/support/messages
// Body: { message: string, tenantId?: string }  (tenantId required for admin)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();
  const body = await req.json();
  const text = (body.message || "").trim();
  if (!text) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const isAdmin = auth.user.role === "super_admin";
  let tenantOid: ObjectId;

  if (isAdmin) {
    if (!body.tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    tenantOid = new ObjectId(body.tenantId);
  } else {
    tenantOid = auth.user._id;
  }

  const doc = {
    tenantId: tenantOid,
    fromAdmin: isAdmin,
    message: text,
    read: false,
    createdAt: new Date(),
  };

  const result = await db.collection("support_messages").insertOne(doc);
  return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 });
}
