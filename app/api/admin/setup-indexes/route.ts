import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-helpers";

// POST /api/admin/setup-indexes — idempotent, safe to run multiple times
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();
  const results: string[] = [];

  async function idx(collection: string, spec: Record<string, 1 | -1 | "text">, options: Record<string, unknown> = {}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.collection(collection) as any).createIndex(spec, options);
    results.push(`${collection}: ${JSON.stringify(spec)}`);
  }

  // platform_users
  await idx("platform_users", { email: 1 }, { unique: true });
  await idx("platform_users", { role: 1 });
  await idx("platform_users", { createdAt: -1 });

  // otps — TTL index auto-deletes expired OTPs
  await idx("otps", { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await idx("otps", { email: 1, type: 1 });

  // apps
  await idx("apps", { userId: 1 });
  await idx("apps", { slug: 1 }, { unique: true });
  await idx("apps", { customDomain: 1 }, { sparse: true, unique: true });
  await idx("apps", { status: 1 });
  await idx("apps", { plan: 1 });
  await idx("apps", { createdAt: -1 });

  // domains
  await idx("domains", { domain: 1 }, { unique: true });
  await idx("domains", { appId: 1 });
  await idx("domains", { userId: 1 });
  await idx("domains", { verified: 1 });

  // payments
  await idx("payments", { userId: 1 });
  await idx("payments", { appId: 1 });
  await idx("payments", { razorpayOrderId: 1 }, { unique: true });
  await idx("payments", { createdAt: -1 });

  return NextResponse.json({ message: "Indexes created.", indexes: results });
}
