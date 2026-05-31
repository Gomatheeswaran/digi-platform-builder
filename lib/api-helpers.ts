import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { getDb } from "./db";
import { ObjectId } from "mongodb";
import type { PlatformUser } from "@/types";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function requireAuth(
  req: NextRequest
): Promise<{ user: PlatformUser } | NextResponse> {
  const token =
    req.cookies.get("ap_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return unauthorized();

  const payload = verifyToken(token);
  if (!payload) return unauthorized();

  const db = await getDb();
  const user = await db
    .collection<PlatformUser>("platform_users")
    .findOne({ _id: new ObjectId(payload.userId) });

  if (!user) return unauthorized();
  return { user };
}
