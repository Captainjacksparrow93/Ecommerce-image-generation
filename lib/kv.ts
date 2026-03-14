import type { AppSettings } from "@/types";
import { AVAILABLE_MODELS } from "./gemini";
import { promises as fs } from "fs";
import path from "path";

const VALID_MODEL_IDS = new Set(AVAILABLE_MODELS.map((m) => m.id));

// File-based persistent storage for VPS hosting (no external Redis needed)
const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin@123",
  defaultModel: "imagen-3.0-generate-002",
  maxConcurrentGenerations: 3,
  customPromptPrefix: "",
  watermarkText: "",
};

async function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE);
  await fs.mkdir(dir, { recursive: true });
}

export async function getSettings(): Promise<AppSettings> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    const stored: Partial<AppSettings> = JSON.parse(raw);

    // Merge with defaults so new fields are always present
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      // Always fall back to env var if file setting is empty
      geminiApiKey:
        stored.geminiApiKey || process.env.GEMINI_API_KEY || "",
      adminPassword:
        stored.adminPassword || process.env.ADMIN_PASSWORD || "Admin@123",
      // Reset to default if the stored model is no longer valid
      defaultModel:
        stored.defaultModel && VALID_MODEL_IDS.has(stored.defaultModel)
          ? stored.defaultModel
          : DEFAULT_SETTINGS.defaultModel,
    };
  } catch {
    // File doesn't exist or is invalid JSON — use env var defaults
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(
  partial: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };

  try {
    await ensureDataDir();
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(updated, null, 2),
      "utf-8"
    );
  } catch (err) {
    // Filesystem not writable — settings won't persist
    console.warn("Failed to persist settings:", err);
  }

  return updated;
}
