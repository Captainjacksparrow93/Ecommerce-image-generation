import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ImageFormat, ProductDetails } from "@/types";
import { buildGenerationPrompt } from "./prompts";

const IMAGEN_MODEL = "imagen-3.0-generate-002";
const GEMINI_FLASH_MODEL = "gemini-2.5-flash-image";

export async function generateImage(
  apiKey: string,
  format: ImageFormat,
  product: ProductDetails,
  productImageBase64: string,
  customPromptPrefix?: string,
  modelOverride?: string,
  variantIndex = 0
): Promise<string> {
  const prompt = buildGenerationPrompt(format, product, customPromptPrefix, variantIndex);
  const modelToUse = modelOverride || IMAGEN_MODEL;

  try {
    if (modelToUse === IMAGEN_MODEL || modelToUse.startsWith("imagen")) {
      return await generateWithImagen(
        apiKey,
        prompt,
        format,
        productImageBase64
      );
    } else {
      return await generateWithGeminiFlash(
        apiKey,
        prompt,
        productImageBase64,
        modelToUse
      );
    }
  } catch (err: unknown) {
    const error = err as Error;
    // If Imagen fails (e.g., not available in region), fall back to Gemini Flash
    if (modelToUse === IMAGEN_MODEL) {
      console.warn(
        "Imagen 3 failed, falling back to Gemini Flash:",
        error.message
      );
      return await generateWithGeminiFlash(
        apiKey,
        prompt,
        productImageBase64,
        GEMINI_FLASH_MODEL
      );
    }
    throw err;
  }
}

async function generateWithImagen(
  apiKey: string,
  prompt: string,
  format: ImageFormat,
  productImageBase64: string
): Promise<string> {
  // Imagen 3 via Google AI API (REST endpoint)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:generateImages?key=${apiKey}`;

  const body: Record<string, unknown> = {
    prompt: { text: prompt },
    number_of_images: 1,
    aspect_ratio: getNearestAspectRatio(format.width, format.height),
    safety_filter_level: "block_few",
    person_generation: "allow_adult",
  };

  if (productImageBase64) {
    body.seed = undefined; // optional
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message || `Imagen API error: ${response.status}`);
  }

  const data = await response.json() as {
    predictions?: Array<{ bytesBase64Encoded?: string }>;
  };

  const imageBytes = data.predictions?.[0]?.bytesBase64Encoded;
  if (!imageBytes) {
    throw new Error("No image returned from Imagen 3");
  }
  return imageBytes;
}

async function generateWithGeminiFlash(
  apiKey: string,
  prompt: string,
  productImageBase64: string,
  modelName: string
): Promise<string> {
  // Use direct REST API for image generation (SDK types don't cover responseModalities yet)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const parts: Array<Record<string, unknown>> = [];

  if (productImageBase64) {
    parts.push({
      text: "Reference product image (use this product in your composition):",
    });
    parts.push({
      inlineData: { mimeType: "image/png", data: productImageBase64 },
    });
  }
  parts.push({ text: prompt });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(
      err.error?.message || `Gemini API error: ${response.status}`
    );
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string };
        }>;
      };
    }>;
  };

  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
  }

  throw new Error("No image returned from Gemini Flash image generation");
}

function getNearestAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.05) return "1:1";
  if (Math.abs(ratio - 4 / 5) < 0.05) return "4:5";
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (ratio > 1) return "16:9";
  return "9:16";
}

export const AVAILABLE_MODELS = [
  { id: "imagen-3.0-generate-002", label: "Imagen 3 (Best Quality)" },
  {
    id: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image (Fast)",
  },
];

// Keep SDK import to avoid unused import warning — used for type reference only
void GoogleGenerativeAI;
