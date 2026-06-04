import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import type { TenantApp } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid app" }, { status: 400 });

  const { name, email, password, phone } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = await getDb();
  const app = await db.collection<TenantApp>("apps").findOne({ _id: new ObjectId(id) });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  const collection = `app_data_${id}_customers`;
  const existing = await db.collection(collection).findOne({ email: email.toLowerCase().trim() });
  if (existing) return NextResponse.json({ error: "Email is already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const result = await db.collection(collection).insertOne({
    appId: id,
    modelSlug: "customers",
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || "",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(
    { id: result.insertedId.toString(), name: name.trim(), email: email.toLowerCase().trim() },
    { status: 201 }
  );
}
