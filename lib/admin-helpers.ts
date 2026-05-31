import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./api-helpers";
import type { PlatformUser } from "@/types";

export async function requireSuperAdmin(
  req: NextRequest
): Promise<{ user: PlatformUser } | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return auth;
}
