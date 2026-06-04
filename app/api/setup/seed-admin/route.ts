import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

const ADMIN_EMAIL = "admin@digiplatform.com";
const DEFAULT_PASSWORD = "Admin$241003"; // change after first login

// POST /api/setup/seed-admin
// Creates the platform super admin account if it doesn't already exist.
// Safe to call multiple times — idempotent.
export async function POST() {
  const db = await getDb();

  const existing = await db.collection("platform_users").findOne({ email: ADMIN_EMAIL });
  if (existing) {
    return NextResponse.json({ message: "Super admin account already exists.", alreadyExists: true });
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const now = new Date();

  await db.collection("platform_users").insertOne({
    name: "Platform Admin",
    email: ADMIN_EMAIL,
    password: passwordHash,
    role: "super_admin",
    isEmailVerified: true,
    plan: "pro",
    suspended: false,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    message: "Super admin account created.",
    email: ADMIN_EMAIL,
    note: `Default password is '${DEFAULT_PASSWORD}'. Change it immediately after first login.`,
  }, { status: 201 });
}
