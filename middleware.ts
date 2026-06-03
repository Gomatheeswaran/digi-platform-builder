import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that must remain public regardless of IP
const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/templates",
  "/api/tenant",          // custom-domain renderer fetches app config here
  "/api/billing/webhook", // Razorpay uses HMAC signature, not JWT
];

function isLocalIp(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const raw = forwarded?.split(",")[0]?.trim() || realIp || "";
  const ip = raw.replace(/^::ffff:/, ""); // normalise IPv4-mapped IPv6

  return (
    !ip ||                                      // no IP header → local dev server
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)      // 172.16 – 172.31
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard API routes
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Public routes — no auth needed from any IP
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Local network — allow without token (development / LAN access)
  if (isLocalIp(req)) return NextResponse.next();

  // Extract JWT from cookie or Authorization: Bearer header
  const token =
    req.cookies.get("ap_token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    // jose automatically rejects expired tokens (1 h expiry enforced by signToken)
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export const config = {
  matcher: "/api/:path*",
};
