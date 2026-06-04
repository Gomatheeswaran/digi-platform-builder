import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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

  const { amount, customerName, customerEmail } = await req.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const db = await getDb();
  const app = await db.collection<TenantApp>("apps").findOne({ _id: new ObjectId(id) });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  const rzp = app.config.integrations?.razorpay;
  if (!rzp?.enabled || !rzp.keyId || !rzp.keySecret) {
    return NextResponse.json({ error: "Razorpay is not configured for this app" }, { status: 400 });
  }

  // Create Razorpay order via REST API (key secret stays server-side only)
  const auth = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString("base64");
  const receipt = `rcpt_${Date.now()}`;

  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // paise
      currency: (app.config.settings?.currency as string) || "INR",
      receipt,
      notes: { customerName, customerEmail, appId: id },
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.json();
    return NextResponse.json(
      { error: err.error?.description || "Failed to create payment order" },
      { status: 502 }
    );
  }

  const order = await rzpRes.json();

  return NextResponse.json({
    orderId: order.id,        // razorpay order id
    amount: order.amount,     // in paise
    currency: order.currency,
    keyId: rzp.keyId,         // public key — safe to send to client
    appName: app.name,
  });
}
