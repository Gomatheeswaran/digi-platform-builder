import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      customerId: string;
      appId: string;
      name: string;
      email: string;
      phone?: string;
    };

    if (payload.appId !== id) {
      return NextResponse.json({ error: "Token not valid for this app" }, { status: 401 });
    }

    const db = await getDb();
    const collection = `app_data_${id}_customers`;
    const customer = await db.collection(collection).findOne({ _id: new ObjectId(payload.customerId) });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    return NextResponse.json({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
