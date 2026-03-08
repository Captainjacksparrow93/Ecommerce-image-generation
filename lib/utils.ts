import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] || "";
}

export function base64ToDataUrl(base64: string, mimeType = "image/png"): string {
  return `data:${mimeType};base64,${base64}`;
}
