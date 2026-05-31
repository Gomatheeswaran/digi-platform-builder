import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth";

export async function POST() {
  const opts = cookieOptions("");
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set({ ...opts, maxAge: 0 });
  return response;
}
