import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, badRequest } from "@/lib/api-helpers";
import { slugify, isValidSlug } from "@/lib/validators";
import { TEMPLATE_MAP } from "@/constants/templates";
import type { TenantApp } from "@/types";

// GET /api/apps — list all apps for the logged-in user
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();
  const apps = await db
    .collection<TenantApp>("apps")
    .find({ userId: auth.user._id })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(
    apps.map((a) => ({
      id: a._id,
      name: a.name,
      slug: a.slug,
      description: a.description,
      template: a.template,
      status: a.status,
      customDomain: a.customDomain,
      domainVerified: a.domainVerified,
      sslStatus: a.sslStatus,
      plan: a.plan,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }))
  );
}

// POST /api/apps — create a new app
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, description, template } = body;
  let { slug } = body;

  if (!name?.trim()) return badRequest("App name is required.");
  if (!template || !TEMPLATE_MAP[template as keyof typeof TEMPLATE_MAP]) {
    return badRequest("Invalid template.");
  }

  slug = slug ? slug.toLowerCase() : slugify(name);
  if (!isValidSlug(slug)) {
    return badRequest("Slug must be 3-40 lowercase letters, numbers, or hyphens.");
  }

  const db = await getDb();

  // Enforce free-tier 3-app limit
  if (auth.user.role !== "super_admin") {
    const existing = await db.collection("apps").countDocuments({ userId: auth.user._id });
    if (existing >= 3) {
      return NextResponse.json(
        { error: "Free tier is limited to 3 applications. Please upgrade your plan to create more." },
        { status: 403 }
      );
    }
  }

  // Ensure slug is globally unique
  const slugExists = await db.collection("apps").findOne({ slug });
  if (slugExists) {
    return badRequest("That slug is already taken. Choose a different one.");
  }

  const templateDef = TEMPLATE_MAP[template as keyof typeof TEMPLATE_MAP];
  const now = new Date();

  const result = await db.collection<Omit<TenantApp, "_id">>("apps").insertOne({
    userId: auth.user._id,
    name: name.trim(),
    slug,
    description: description?.trim() || "",
    template: template as TenantApp["template"],
    config: JSON.parse(JSON.stringify(templateDef.defaultConfig)), // deep copy
    status: "draft",
    customDomain: null,
    domainVerified: false,
    sslStatus: "none",
    plan: "free",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    id: result.insertedId,
    name: name.trim(),
    slug,
    template,
    status: "draft",
  }, { status: 201 });
}
