import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getDb } from "@/lib/db";

// GET /api/support/threads  — super_admin only
// Returns all tenant threads sorted by last activity, with unread counts.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.user.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getDb();

  const threads = await db
    .collection("support_messages")
    .aggregate([
      {
        $group: {
          _id: "$tenantId",
          lastMessage: { $last: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$fromAdmin", false] }, { $eq: ["$read", false] }] },
                1,
                0,
              ],
            },
          },
          lastActivity: { $max: "$createdAt" },
          totalMessages: { $sum: 1 },
        },
      },
      { $sort: { lastActivity: -1 } },
      {
        $lookup: {
          from: "platform_users",
          localField: "_id",
          foreignField: "_id",
          as: "tenant",
        },
      },
      { $unwind: { path: "$tenant", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          lastActivity: 1,
          totalMessages: 1,
          "tenant._id": 1,
          "tenant.name": 1,
          "tenant.email": 1,
          "tenant.plan": 1,
        },
      },
    ])
    .toArray();

  return NextResponse.json({ threads });
}
