import { NextRequest, NextResponse } from "next/server";
import { proxy, config as proxyConfig } from "./proxy";

export async function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // Handle CORS preflight
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const res = await proxy(req);

  // Attach CORS headers to API responses
  if (req.nextUrl.pathname.startsWith("/api/") && origin) {
    const headers = corsHeaders(origin);
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  }

  return res;
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = proxyConfig;
