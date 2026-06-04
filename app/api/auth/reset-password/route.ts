import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import type { OTPRecord } from "@/types";

// POST /api/auth/reset-password
// Body: { email, otp, newPassword }
export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email?.trim() || !otp || !newPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = await getDb();

    // Find a valid (non-expired) reset OTP for this account
    const record = await db
      .collection<OTPRecord>("otps")
      .findOne({ email: normalizedEmail, type: "reset", expiresAt: { $gt: new Date() } });

    if (!record) {
      return NextResponse.json({ error: "OTP expired or not found. Please request a new one." }, { status: 400 });
    }
    if (record.attempts >= 5) {
      return NextResponse.json({ error: "Too many incorrect attempts. Please request a new OTP." }, { status: 400 });
    }

    const valid = await bcrypt.compare(otp, record.otpHash);
    if (!valid) {
      await db.collection("otps").updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return NextResponse.json({ error: "Incorrect OTP." }, { status: 400 });
    }

    // Update the password
    const hash = await bcrypt.hash(newPassword, 12);
    const result = await db.collection("platform_users").updateOne(
      { email: normalizedEmail },
      { $set: { password: hash, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Clean up all reset OTPs for this account
    await db.collection("otps").deleteMany({ email: normalizedEmail, type: "reset" });

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Reset failed." }, { status: 500 });
  }
}
