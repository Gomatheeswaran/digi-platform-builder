import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";

// POST /api/billing/webhook — Razorpay webhook handler
// Configure in Razorpay dashboard: https://dashboard.razorpay.com/app/webhooks
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (expectedSig !== signature) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const db = await getDb();

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const notes = payment.notes || {};

    if (notes.appId) {
      const { ObjectId } = await import("mongodb");
      if (ObjectId.isValid(notes.appId)) {
        await db.collection("apps").updateOne(
          { _id: new ObjectId(notes.appId) },
          {
            $set: {
              plan: "hosted",
              razorpayOrderId: payment.order_id,
              updatedAt: new Date(),
            },
          }
        );

        // Upsert payment record
        await db.collection("payments").updateOne(
          { razorpayPaymentId: payment.id },
          {
            $set: {
              razorpayOrderId: payment.order_id,
              razorpayPaymentId: payment.id,
              appId: new ObjectId(notes.appId),
              amount: payment.amount,
              currency: payment.currency,
              status: "captured",
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
