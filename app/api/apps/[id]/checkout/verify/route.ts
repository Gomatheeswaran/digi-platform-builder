import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import type { TenantApp } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid app ID" }, { status: 400 });
  }

  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    customerDetails,  // { customerName, customerEmail, customerPhone, address, city, state, pincode }
    items,            // [{ name, qty, price }]
    amount,
    paymentMethod = "razorpay",
  } = await req.json();

  const db = await getDb();
  const app = await db.collection<TenantApp>("apps").findOne({ _id: new ObjectId(id) });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  // Verify Razorpay HMAC signature
  if (paymentMethod === "razorpay") {
    const rzp = app.config.integrations?.razorpay;
    if (!rzp?.keySecret) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 400 });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", rzp.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }
  }

  // Save order to MongoDB in the same collection the data manager reads from
  const collection = `app_data_${id}_orders`;
  const now = new Date();

  const orderDoc = {
    appId: id,
    modelSlug: "orders",
    status: paymentMethod === "razorpay" ? "paid" : "pending",
    amount,
    ...customerDetails,
    items: JSON.stringify(items),
    razorpayOrderId: razorpayOrderId || null,
    razorpayPaymentId: razorpayPaymentId || null,
    paymentMethod,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(collection).insertOne(orderDoc);

  return NextResponse.json({ success: true, orderId: result.insertedId.toString() }, { status: 201 });
}
