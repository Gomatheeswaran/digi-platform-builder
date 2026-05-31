import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { signToken, cookieOptions } from "@/lib/auth";
import { isGmail } from "@/lib/validators";
import type { OTPRecord, PlatformUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!email || !isGmail(email)) {
      return NextResponse.json({ error: "Only Gmail accounts are allowed." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = await getDb();

    // Check duplicate
    const existing = await db.collection("platform_users").findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: "Account already exists." }, { status: 409 });
    }

    // Verify OTP
    const otpRecord = await db
      .collection<OTPRecord>("otps")
      .findOne({
        email: normalizedEmail,
        type: "register",
        expiresAt: { $gt: new Date() },
      });

    if (!otpRecord) {
      return NextResponse.json({ error: "OTP expired or not found. Request a new one." }, { status: 400 });
    }
    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: "Too many incorrect attempts. Request a new OTP." }, { status: 400 });
    }

    const otpValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!otpValid) {
      await db.collection("otps").updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } }
      );
      return NextResponse.json({ error: "Incorrect OTP." }, { status: 400 });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const result = await db.collection<Omit<PlatformUser, "_id">>("platform_users").insertOne({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: "tenant_admin",
      isEmailVerified: true,
      plan: "free",
      createdAt: now,
      updatedAt: now,
    });

    // Clean up used OTPs
    await db.collection("otps").deleteMany({ email: normalizedEmail, type: "register" });

    const token = signToken({ userId: result.insertedId.toString(), role: "tenant_admin" });
    const opts = cookieOptions(token);

    const response = NextResponse.json({
      message: "Account created successfully!",
      user: { id: result.insertedId, name: name.trim(), email: normalizedEmail, role: "tenant_admin", plan: "free" },
    });
    response.cookies.set(opts);

    return response;
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
