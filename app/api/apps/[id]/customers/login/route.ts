import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";
import type { TenantApp } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid app" }, { status: 400 });

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const db = await getDb();
  const app = await db.collection<TenantApp>("apps").findOne({ _id: new ObjectId(id) });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  const collection = `app_data_${id}_customers`;
  const customer = await db.collection(collection).findOne({ email: email.toLowerCase().trim() });

  if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = jwt.sign(
    {
      customerId: customer._id.toString(),
      appId: id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return NextResponse.json({
    token,
    customer: {
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
    },
  });
}
