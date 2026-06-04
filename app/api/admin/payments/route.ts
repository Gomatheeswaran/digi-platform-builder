import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";

// GET /api/admin/payments?page=1&limit=20&search=email
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 20));
  const search = searchParams.get("search")?.trim() || "";

  const db = await getDb();

  // Aggregate payments with user and app details
  const pipeline = [
    // Join with platform_users
    {
      $lookup: {
        from: "platform_users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

    // Join with apps
    {
      $lookup: {
        from: "apps",
        localField: "appId",
        foreignField: "_id",
        as: "app",
      },
    },
    { $unwind: { path: "$app", preserveNullAndEmptyArrays: true } },

    // Optional search by tenant name or email
    ...(search
      ? [
          {
            $match: {
              $or: [
                { "user.name": { $regex: search, $options: "i" } },
                { "user.email": { $regex: search, $options: "i" } },
                { razorpayPaymentId: { $regex: search, $options: "i" } },
                { "app.name": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),

    { $sort: { createdAt: -1 } },

    // Facet for pagination + total count in one query
    {
      $facet: {
        records: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              amount: 1,
              currency: 1,
              status: 1,
              razorpayOrderId: 1,
              razorpayPaymentId: 1,
              createdAt: 1,
              "user._id": 1,
              "user.name": 1,
              "user.email": 1,
              "app._id": 1,
              "app.name": 1,
              "app.plan": 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await db.collection("payments").aggregate(pipeline).toArray();
  const records = result?.records || [];
  const total = result?.total?.[0]?.count || 0;

  // Overall revenue summary
  const [summary] = await db
    .collection("payments")
    .aggregate([
      {
        $group: {
          _id: null,
          totalPaise: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  return NextResponse.json({
    records,
    total,
    page,
    limit,
    summary: {
      totalPaise: summary?.totalPaise || 0,
      count: summary?.count || 0,
    },
  });
}
