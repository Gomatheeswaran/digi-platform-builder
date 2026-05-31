import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import type { OTPRecord } from "@/types";

// Lightweight endpoint: just verify OTP is correct before proceeding (used for pre-validation in multi-step flows)
export async function POST(req: NextRequest) {
  try {
    const { email, otp, type } = await req.json();
    if (!email || !otp || !type) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const db = await getDb();
    const otpRecord = await db
      .collection<OTPRecord>("otps")
      .findOne({ email: email.toLowerCase(), type, expiresAt: { $gt: new Date() } });

    if (!otpRecord) {
      return NextResponse.json({ valid: false, error: "OTP expired or not found." });
    }

    const valid = await bcrypt.compare(otp, otpRecord.otpHash);
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
