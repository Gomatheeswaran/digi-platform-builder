import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { TenantApp } from "@/types";

// Internal API: GET /api/tenant?host=myshop.com
// Used by the tenant renderer to fetch app config by domain
export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get("host");
  if (!host) return NextResponse.json({ error: "No host provided" }, { status: 400 });

  const db = await getDb();

  // Find app by custom domain
  const app = await db.collection<TenantApp>("apps").findOne({
    customDomain: host.toLowerCase().replace(/^www\./, ""),
    status: "live",
    domainVerified: true,
  });

  if (!app) {
    return NextResponse.json({ error: "App not found or not live" }, { status: 404 });
  }

  return NextResponse.json({
    id: app._id,
    name: app.name,
    slug: app.slug,
    template: app.template,
    config: app.config,
  });
}
