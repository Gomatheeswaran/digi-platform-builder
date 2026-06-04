import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { signToken, cookieOptions } from "@/lib/auth";
import type { PlatformUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db
      .collection<PlatformUser>("platform_users")
      .findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.suspended) {
      return NextResponse.json({ error: "Account suspended. Contact support." }, { status: 403 });
    }

    // Track last login time
    await db.collection("platform_users").updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    const token = signToken({ userId: user._id.toString(), role: user.role });
    const opts = cookieOptions(token);

    const response = NextResponse.json({
      message: "Logged in successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });
    response.cookies.set(opts);

    return response;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
