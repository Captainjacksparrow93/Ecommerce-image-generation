import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/kv";
import { maskApiKey } from "@/lib/utils";
import type { AppSettings } from "@/types";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    ...settings,
    geminiApiKey: maskApiKey(settings.geminiApiKey),
    adminPassword: "••••••••",
  });
}

export async function POST(req: NextRequest) {
  let body: Partial<AppSettings>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Don't allow clearing the API key with masked value
  if (body.geminiApiKey && body.geminiApiKey.includes("••")) {
    delete body.geminiApiKey;
  }
  if (body.adminPassword && body.adminPassword.includes("••")) {
    delete body.adminPassword;
  }

  const updated = await updateSettings(body);
  return NextResponse.json({
    ...updated,
    geminiApiKey: maskApiKey(updated.geminiApiKey),
    adminPassword: "••••••••",
  });
}
