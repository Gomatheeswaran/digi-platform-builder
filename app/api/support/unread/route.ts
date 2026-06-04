import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getDb } from "@/lib/db";

// GET /api/support/unread
// Tenant → count of unread admin replies
// Admin  → count of tenants with unread messages from them
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();

  if (auth.user.role === "super_admin") {
    // Distinct tenants that have sent unread messages
    const tenantIds = await db
      .collection("support_messages")
      .distinct("tenantId", { fromAdmin: false, read: false });
    return NextResponse.json({ unread: tenantIds.length });
  }

  // Tenant: count unread replies from admin
  const count = await db.collection("support_messages").countDocuments({
    tenantId: auth.user._id,
    fromAdmin: true,
    read: false,
  });

  return NextResponse.json({ unread: count });
}
