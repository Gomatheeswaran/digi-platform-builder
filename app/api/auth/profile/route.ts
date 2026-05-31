import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

// PUT /api/auth/profile — update name or change password
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const db = await getDb();

  // Update name
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }
    await db.collection("platform_users").updateOne(
      { _id: auth.user._id },
      { $set: { name, updatedAt: new Date() } }
    );
    return NextResponse.json({ message: "Profile updated." });
  }

  // Change password
  if (body.currentPassword !== undefined) {
    const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both passwords are required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }

    const match = await bcrypt.compare(currentPassword, auth.user.password);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await db.collection("platform_users").updateOne(
      { _id: auth.user._id },
      { $set: { password: hash, updatedAt: new Date() } }
    );
    return NextResponse.json({ message: "Password updated." });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}
