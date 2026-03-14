"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Cpu,
  Sliders,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_MODELS } from "@/lib/gemini";
import type { AppSettings } from "@/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [dirtyApiKey, setDirtyApiKey] = useState("");
  const [dirtyAdminPw, setDirtyAdminPw] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const save = async () => {
    setSaveState("saving");
    setSaveError("");
    try {
      const payload: Partial<AppSettings> = {
        ...settings,
        defaultModel: settings.defaultModel,
        maxConcurrentGenerations: settings.maxConcurrentGenerations,
        customPromptPrefix: settings.customPromptPrefix,
        watermarkText: settings.watermarkText,
      };
      if (dirtyApiKey) payload.geminiApiKey = dirtyApiKey;
      if (dirtyAdminPw) payload.adminPassword = dirtyAdminPw;

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      const updated = await res.json();
      setSettings(updated);
      setDirtyApiKey("");
      setDirtyAdminPw("");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      const e = err as Error;
      setSaveError(e.message);
      setSaveState("error");
    }
  };

  const set = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure API keys, models, and generation settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            title="Refresh settings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Configuration */}
      <Section icon={<Key className="w-5 h-5" />} title="API Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={dirtyApiKey || settings.geminiApiKey || ""}
                onChange={(e) => setDirtyApiKey(e.target.value)}
                placeholder="AIza..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-start gap-1">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showAdminPw ? "text" : "password"}
                value={dirtyAdminPw || ""}
                onChange={(e) => setDirtyAdminPw(e.target.value)}
                placeholder="Leave blank to keep current password"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowAdminPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showAdminPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Model Settings */}
      <Section icon={<Cpu className="w-5 h-5" />} title="Model Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Default Generation Model
            </label>
            <select
              value={settings.defaultModel || "imagen-3.0-generate-002"}
              onChange={(e) => set("defaultModel", e.target.value)}
              className={inputClass}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Imagen 3 produces the highest quality images. Gemini 2.0 Flash is
              faster and better at following complex instructions.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Max Concurrent Generations
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.maxConcurrentGenerations ?? 3}
              onChange={(e) =>
                set("maxConcurrentGenerations", Number(e.target.value))
              }
              className={inputClass}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Maximum number of format images to generate per request.
              Higher values use more API quota.
            </p>
          </div>
        </div>
      </Section>

      {/* Prompt Customization */}
      <Section
        icon={<Sliders className="w-5 h-5" />}
        title="Prompt Customization"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Custom Prompt Prefix
            </label>
            <textarea
              value={settings.customPromptPrefix || ""}
              onChange={(e) => set("customPromptPrefix", e.target.value)}
              placeholder="e.g. Always use a pastel color palette. Maintain a minimalist aesthetic..."
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              This text is prepended to every generation prompt. Use it to
              enforce brand guidelines or style rules.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Watermark Text
            </label>
            <input
              type="text"
              value={settings.watermarkText || ""}
              onChange={(e) => set("watermarkText", e.target.value)}
              placeholder="e.g. Draft — Not for distribution"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Optional watermark text to include in generation prompts (not
              burned in — instructed via prompt).
            </p>
          </div>
        </div>
      </Section>

      {/* Vercel KV Info */}
      <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300">
              Upstash Redis / KV Storage
            </p>
            <p className="text-blue-600 dark:text-blue-400 mt-1">
              Settings are stored in Upstash Redis. For Vercel deployment, add
              the Upstash Redis integration from the Vercel Marketplace and set{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                UPSTASH_REDIS_REST_URL
              </code>{" "}
              and{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                UPSTASH_REDIS_REST_TOKEN
              </code>{" "}
              environment variables. Without KV, settings fall back to{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                .env.local
              </code>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between">
        {saveState === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
        )}
        {saveState === "saved" && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Settings saved successfully
          </p>
        )}
        {(saveState === "idle" || saveState === "saving") && (
          <span />
        )}

        <button
          onClick={save}
          disabled={saveState === "saving"}
          className={cn(
            "ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm",
            "bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-all",
            saveState === "saving" && "opacity-70 cursor-not-allowed"
          )}
        >
          {saveState === "saving" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : saveState === "saved" ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <span className="text-violet-500">{icon}</span>
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow";
