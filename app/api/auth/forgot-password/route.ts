import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { generateOTP, sendOTPEmail } from "@/lib/email";
import type { PlatformUser } from "@/types";

// POST /api/auth/forgot-password
// Body: { email }  — the account login email
// Sends a reset OTP to user.recoveryEmail (if set) or user.email
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = await getDb();

    const user = await db
      .collection<PlatformUser>("platform_users")
      .findOne({ email: normalizedEmail });

    if (!user) {
      // Don't leak whether the account exists
      return NextResponse.json({
        message: "If an account with this email exists, an OTP has been sent.",
      });
    }

    // Rate limit: max 3 per 10 minutes
    const recentCount = await db.collection("otps").countDocuments({
      email: normalizedEmail,
      type: "reset",
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await db.collection("otps").insertOne({
      email: normalizedEmail,
      otpHash,
      type: "reset",
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
    });

    // Send to recoveryEmail if set, otherwise the account email
    const sendTo = user.recoveryEmail || user.email;
    await sendOTPEmail(sendTo, otp, "reset");

    // Return a masked version of the address so the UI can confirm to the user
    const maskedEmail = sendTo.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
      a + b.replace(/./g, "*") + c
    );

    return NextResponse.json({
      message: "OTP sent.",
      maskedEmail,
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Failed to send OTP." }, { status: 500 });
  }
}
