import type { AppSettings } from "@/types";

// Lazy import to avoid issues when KV env vars are not set
async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return Redis.fromEnv();
}

const SETTINGS_KEY = "app:settings";

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  defaultModel: "imagen-3.0-generate-002",
  maxConcurrentGenerations: 3,
  customPromptPrefix: "",
  watermarkText: "",
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const redis = await getRedis();
    const stored = await redis.get<Partial<AppSettings>>(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    // Merge with defaults so new fields are always present
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      // Always fall back to env var if KV key not set
      geminiApiKey:
        stored.geminiApiKey || process.env.GEMINI_API_KEY || "",
      adminPassword:
        stored.adminPassword || process.env.ADMIN_PASSWORD || "admin123",
    };
  } catch {
    // KV not configured — use env var fallback
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(
  partial: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };

  try {
    const redis = await getRedis();
    await redis.set(SETTINGS_KEY, updated);
  } catch {
    // KV not available, settings won't persist across deploys
    console.warn("KV not available — settings not persisted");
  }

  return updated;
}
