/**
 * Custom Next.js server — replaces next/dist middleware (Edge runtime).
 * Runs as a standard Node.js HTTP server so it can use any Node.js API.
 *
 * Usage:
 *   dev   → next dev     (unchanged, proxy only needed in production)
 *   start → tsx proxy.ts (or: node proxy.js after tsc build)
 */
import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import jwt from "jsonwebtoken";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── Public paths: no JWT required ────────────────────────────────────────────
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

// Tenant-facing storefront / checkout / customer auth — use their own JWT, not platform JWT
const TENANT_ROUTE = /^\/api\/apps\/[^/]+\/(checkout|customers|storefront)(\/|$)/;

function isPublic(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (TENANT_ROUTE.test(pathname)) return true;
  return false;
}

// ── JWT helpers ───────────────────────────────────────────────────────────────
function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k.trim(), decodeURIComponent(v.join("="))];
    })
  );
}

function extractToken(req: IncomingMessage): string | null {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.ap_token) return cookies.ap_token;
  const auth = req.headers.authorization;
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7);
  return null;
}

function verifyPlatformJwt(token: string): boolean {
  try {
    jwt.verify(token, process.env.JWT_SECRET || "default-secret");
    return true;
  } catch {
    return false;
  }
}

// ── Response helpers ──────────────────────────────────────────────────────────
function json(res: ServerResponse, status: number, body: object) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

// ── Server ────────────────────────────────────────────────────────────────────
app.prepare().then(() => {
  createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const pathname = parsedUrl.pathname || "/";

      // Guard API routes
      if (pathname.startsWith("/api/") && !isPublic(pathname)) {
        const token = extractToken(req);
        if (!token || !verifyPlatformJwt(token)) {
          json(res, 401, { error: "Unauthorized" });
          return;
        }
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("[proxy] unhandled error:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    }
  }).listen(port, hostname, () => {
    console.log(`> Custom server ready on http://localhost:${port} [${dev ? "development" : "production"}]`);
  });
});
