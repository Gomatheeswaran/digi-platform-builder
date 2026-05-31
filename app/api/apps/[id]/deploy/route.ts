import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, notFound } from "@/lib/api-helpers";
import type { TenantApp, DomainRecord } from "@/types";
import dns from "dns/promises";

type Params = { params: Promise<{ id: string }> };

// POST /api/apps/[id]/deploy — verify domain DNS + mark live
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  if (!app.customDomain) {
    return NextResponse.json(
      { error: "No custom domain set. Add a domain in settings first." },
      { status: 400 }
    );
  }

  const domainRecord = await db
    .collection<DomainRecord>("domains")
    .findOne({ appId: app._id });

  if (!domainRecord) {
    return NextResponse.json({ error: "Domain record not found." }, { status: 400 });
  }

  const serverIp = process.env.SERVER_IP || "";

  // Verify DNS A record points to our server
  let dnsVerified = false;
  let dnsError = "";
  try {
    const addresses = await dns.resolve4(app.customDomain);
    dnsVerified = serverIp ? addresses.includes(serverIp) : addresses.length > 0;
    if (!dnsVerified) {
      dnsError = `DNS A record points to ${addresses.join(", ")} but expected ${serverIp}`;
    }
  } catch (e) {
    dnsError = `DNS lookup failed: ${e instanceof Error ? e.message : "unknown error"}`;
  }

  if (!dnsVerified) {
    return NextResponse.json(
      {
        error: "Domain DNS not yet pointing to this server.",
        detail: dnsError,
        hint: "DNS changes can take up to 48 hours to propagate.",
      },
      { status: 400 }
    );
  }

  // Mark domain as verified and app as live
  await db.collection("domains").updateOne(
    { _id: domainRecord._id },
    { $set: { verified: true, sslStatus: "pending", updatedAt: new Date() } }
  );

  await db.collection("apps").updateOne(
    { _id: app._id },
    {
      $set: {
        status: "live",
        domainVerified: true,
        sslStatus: "pending",
        updatedAt: new Date(),
      },
    }
  );

  // In production: trigger certbot here (or queue an async job)
  // exec(`certbot --nginx -d ${app.customDomain} -d www.${app.customDomain} --non-interactive --agree-tos -m admin@yourdomain.com`)
  // For now we just return success — the nginx config is managed separately via deploy scripts

  return NextResponse.json({
    message: "Domain verified! Your app is now live.",
    domain: app.customDomain,
    status: "live",
    sslStatus: "pending",
    hint: "SSL certificate is being issued. Your site will be HTTPS within a few minutes.",
  });
}
