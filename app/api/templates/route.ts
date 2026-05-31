import { NextResponse } from "next/server";
import { TEMPLATES } from "@/constants/templates";

export async function GET() {
  return NextResponse.json(
    TEMPLATES.map(({ id, name, description, icon, color, features }) => ({
      id, name, description, icon, color, features,
    }))
  );
}
