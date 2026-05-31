import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PLATFORM_HOST = process.env.PLATFORM_HOST || "localhost:3000";
const COOKIE_NAME = "ap_token";

function applyCors(res: NextResponse, origin: string | null): NextResponse {
  const allow = origin ?? "*";
  res.headers.set("Access-Control-Allow-Origin", allow);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

// Protected dashboard routes — require login
const PROTECTED_PATHS = ["/dashboard", "/apps", "/domains", "/billing", "/settings", "/admin"];
const AUTH_PATHS = ["/login", "/register"];

async function isValidToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin");

  // ─── CORS Preflight ───────────────────────────────────────────
  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return applyCors(new NextResponse(null, { status: 204 }), origin);
  }

  // ─── Tenant App Routing ───────────────────────────────────────
  // If the request comes in on a custom domain (not the platform), serve the tenant app
  const hostname = host.split(":")[0];
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  const isPlatformHost =
    isIp ||
    host === PLATFORM_HOST ||
    host === `www.${PLATFORM_HOST}` ||
    host.includes("localhost") ||
    host.includes("127.0.0.1");

  if (!isPlatformHost && !pathname.startsWith("/api/")) {
    const url = req.nextUrl.clone();
    const tenantPath = pathname === "/" ? "/_tenant" : `/_tenant${pathname}`;
    url.pathname = tenantPath;
    url.searchParams.set("__host", host);
    return NextResponse.rewrite(url);
  }

  // ─── Auth Guard (platform dashboard) ─────────────────────────
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  const token =
    req.cookies.get(COOKIE_NAME)?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  const loggedIn = token ? await isValidToken(token) : false;

  if (isProtected && !loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const res = NextResponse.next();
  if (pathname.startsWith("/api/") && origin) {
    applyCors(res, origin);
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)",
  ],
};
