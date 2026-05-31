import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, notFound, badRequest } from "@/lib/api-helpers";
import { isValidDomain } from "@/lib/validators";
import { v4 as uuidv4 } from "uuid";
import type { TenantApp, DomainRecord } from "@/types";

type Params = { params: Promise<{ id: string }> };

// POST /api/apps/[id]/domain — attach or update a custom domain
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Must be on hosted plan
  if (auth.user.plan === "free") {
    return NextResponse.json(
      { error: "Custom domain requires a paid plan. Upgrade to host on your own domain." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const { domain } = await req.json();
  if (!domain || !isValidDomain(domain)) {
    return badRequest("Invalid domain name. Example: myshop.com");
  }

  const normalizedDomain = domain.trim().toLowerCase().replace(/^www\./, "");

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  // Check domain not used by another app
  const domainConflict = await db
    .collection("domains")
    .findOne({ domain: normalizedDomain, appId: { $ne: app._id } });
  if (domainConflict) {
    return badRequest("This domain is already linked to another app.");
  }

  const verificationToken = `ap-verify=${uuidv4()}`;
  const now = new Date();

  await db.collection<Omit<DomainRecord, "_id">>("domains").updateOne(
    { appId: app._id },
    {
      $set: {
        appId: app._id,
        userId: auth.user._id,
        domain: normalizedDomain,
        verified: false,
        sslStatus: "none",
        verificationToken,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  await db.collection("apps").updateOne(
    { _id: app._id },
    { $set: { customDomain: normalizedDomain, domainVerified: false, sslStatus: "none", updatedAt: now } }
  );

  const serverIp = process.env.SERVER_IP || "YOUR_SERVER_IP";

  return NextResponse.json({
    domain: normalizedDomain,
    verificationToken,
    instructions: {
      step1: `Add this DNS A record at your domain registrar:`,
      record: { type: "A", name: "@", value: serverIp, ttl: "3600" },
      wwwRecord: { type: "A", name: "www", value: serverIp, ttl: "3600" },
      step2: `Then click "Verify Domain" in your app settings.`,
      step3: `SSL certificate will be automatically issued after verification.`,
    },
  });
}

// GET /api/apps/[id]/domain — get domain status
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const db = await getDb();
  const domain = await db
    .collection<DomainRecord>("domains")
    .findOne({ appId: new ObjectId(id), userId: auth.user._id });

  if (!domain) return NextResponse.json({ domain: null });

  return NextResponse.json({
    domain: domain.domain,
    verified: domain.verified,
    sslStatus: domain.sslStatus,
    verificationToken: domain.verificationToken,
  });
}

// DELETE /api/apps/[id]/domain — remove custom domain
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  const db = await getDb();
  const app = await db
    .collection<TenantApp>("apps")
    .findOne({ _id: new ObjectId(id), userId: auth.user._id });
  if (!app) return notFound("App not found.");

  await db.collection("domains").deleteOne({ appId: app._id });
  await db.collection("apps").updateOne(
    { _id: app._id },
    { $set: { customDomain: null, domainVerified: false, sslStatus: "none", updatedAt: new Date() } }
  );

  return NextResponse.json({ message: "Domain removed." });
}
