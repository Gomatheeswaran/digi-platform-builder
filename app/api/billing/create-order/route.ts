import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, notFound, badRequest } from "@/lib/api-helpers";
import type { TenantApp } from "@/types";

const KEY_ID = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const AMOUNT = Number(process.env.CUSTOM_DOMAIN_PLAN_AMOUNT || 99900); // paise

// POST /api/billing/create-order  { appId }
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { appId } = await req.json();
  if (!appId || !ObjectId.isValid(appId)) return badRequest("Invalid appId.");

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(appId), userId: auth.user._id });
  if (!app) return notFound("App not found.");
  if (app.plan === "hosted") return badRequest("App is already on the hosted plan.");

  // Create Razorpay order via REST API
  const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const receipt = `ap_${appId}_${Date.now()}`;

  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: AMOUNT,
      currency: "INR",
      receipt,
      notes: {
        appId,
        appName: app.name,
        userId: String(auth.user._id),
        userEmail: auth.user.email,
      },
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.json();
    return NextResponse.json({ error: err.error?.description || "Razorpay order creation failed." }, { status: 500 });
  }

  const order = await rzpRes.json();

  // Persist the pending orderId on the app
  await db.collection("apps").updateOne(
    { _id: app._id },
    { $set: { razorpayOrderId: order.id, updatedAt: new Date() } }
  );

  return NextResponse.json({
    orderId: order.id,
    amount: AMOUNT,
    currency: "INR",
    keyId: KEY_ID,
    appName: app.name,
    userEmail: auth.user.email,
    userName: auth.user.name,
  });
}
