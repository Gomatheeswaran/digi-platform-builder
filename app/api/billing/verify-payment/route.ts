import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, badRequest, notFound } from "@/lib/api-helpers";
import type { TenantApp } from "@/types";

// POST /api/billing/verify-payment
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { appId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

  if (!appId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return badRequest("Missing payment fields.");
  }

  // Verify HMAC-SHA256 signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpaySignature) {
    return NextResponse.json({ error: "Payment signature mismatch." }, { status: 400 });
  }

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(appId), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  // Upgrade app to hosted
  await db.collection("apps").updateOne(
    { _id: app._id },
    {
      $set: {
        plan: "hosted",
        razorpayOrderId: razorpayOrderId,
        updatedAt: new Date(),
      },
    }
  );

  // Store payment record for audit
  await db.collection("payments").insertOne({
    userId: auth.user._id,
    appId: app._id,
    razorpayOrderId,
    razorpayPaymentId,
    amount: Number(process.env.CUSTOM_DOMAIN_PLAN_AMOUNT || 99900),
    currency: "INR",
    status: "captured",
    createdAt: new Date(),
  });

  return NextResponse.json({ message: "Payment verified. App upgraded to hosted plan." });
}
