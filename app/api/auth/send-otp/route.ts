import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { generateOTP, sendOTPEmail } from "@/lib/email";
import { isGmail } from "@/lib/validators";
import type { OTPRecord } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();

    if (!email || !isGmail(email)) {
      return NextResponse.json(
        { error: "Only Gmail accounts (@gmail.com) are allowed." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = await getDb();

    if (type === "register") {
      const existing = await db
        .collection("platform_users")
        .findOne({ email: normalizedEmail });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this Gmail already exists." },
          { status: 409 }
        );
      }
    }

    // Rate limit: max 3 OTPs per email per 10 minutes
    const recentCount = await db.collection<OTPRecord>("otps").countDocuments({
      email: normalizedEmail,
      type,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 10 minutes and try again." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await db.collection<Omit<OTPRecord, "_id">>("otps").insertOne({
      email: normalizedEmail,
      otpHash,
      type: type as OTPRecord["type"],
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
    });

    await sendOTPEmail(normalizedEmail, otp, type);

    return NextResponse.json({ message: "OTP sent to your Gmail." });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP." }, { status: 500 });
  }
}
