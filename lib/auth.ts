import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { ObjectId } from "mongodb";
import type { PlatformUser } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "ap_token";

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<PlatformUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const db = await getDb();
  const user = await db
    .collection<PlatformUser>("platform_users")
    .findOne({ _id: new ObjectId(payload.userId) });

  return user;
}

export function cookieOptions(token = "") {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}
