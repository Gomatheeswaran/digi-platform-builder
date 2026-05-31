import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    });
  } catch {
    return NextResponse.json({ error: "Failed to get session." }, { status: 500 });
  }
}
