import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that are always public — no JWT required
const PUBLIC_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/templates",
  "/api/tenant",
  "/api/billing/webhook",
  "/api/setup/seed-admin",
];

// Tenant-facing routes — use their own customer JWT, not platform JWT
const TENANT_ROUTE = /^\/api\/apps\/[^/]+\/(checkout|customers|storefront)(\/|$)/;

function isPublic(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (TENANT_ROUTE.test(pathname)) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard API routes
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Public — pass through immediately
  if (isPublic(pathname)) return NextResponse.next();

  // Extract platform JWT from cookie or Authorization header
  const token =
    req.cookies.get("ap_token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export const config = {
  matcher: "/api/:path*",
};
