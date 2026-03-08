import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/kv";
import { generateImage } from "@/lib/gemini";
import { getFormatById } from "@/lib/formats";
import type { GenerationRequest, GenerationResult } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: GenerationRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, product, formatQuantities, customPromptPrefix } = body;

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }
  if (!product?.productName) {
    return NextResponse.json(
      { error: "Product name is required" },
      { status: 400 }
    );
  }
  if (!formatQuantities || Object.keys(formatQuantities).length === 0) {
    return NextResponse.json(
      { error: "At least one format must be selected" },
      { status: 400 }
    );
  }

  const settings = await getSettings();
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Gemini API key not configured. Please set it in the admin panel.",
      },
      { status: 503 }
    );
  }

  const promptPrefix =
    customPromptPrefix || settings.customPromptPrefix || undefined;

  // Expand formatQuantities into individual generation tasks
  interface Task {
    formatId: string;
    variantIndex: number;
    totalVariants: number;
  }

  const tasks: Task[] = [];
  for (const [formatId, qty] of Object.entries(formatQuantities)) {
    const count = Math.max(1, Math.min(5, qty)); // clamp 1-5
    for (let i = 0; i < count; i++) {
      tasks.push({ formatId, variantIndex: i, totalVariants: count });
    }
  }

  const results: GenerationResult[] = [];
  const errors: { formatId: string; variantIndex: number; message: string }[] =
    [];

  // Process in batches of 2 to avoid rate limits
  const BATCH_SIZE = 2;
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (task) => {
        const format = getFormatById(task.formatId);
        if (!format) throw new Error(`Unknown format: ${task.formatId}`);

        const imageBase64 = await generateImage(
          apiKey,
          format,
          product,
          image,
          promptPrefix,
          settings.defaultModel,
          task.variantIndex
        );

        return {
          formatId: task.formatId,
          label: format.label,
          width: format.width,
          height: format.height,
          image: imageBase64,
          variantIndex: task.variantIndex,
          totalVariants: task.totalVariants,
        } as GenerationResult;
      })
    );

    batchResults.forEach((result, idx) => {
      const task = batch[idx];
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const msg =
          result.reason instanceof Error
            ? result.reason.message
            : "Generation failed";
        errors.push({
          formatId: task.formatId,
          variantIndex: task.variantIndex,
          message: msg,
        });
        const format = getFormatById(task.formatId);
        results.push({
          formatId: task.formatId,
          label: format?.label || task.formatId,
          width: format?.width || 0,
          height: format?.height || 0,
          image: "",
          variantIndex: task.variantIndex,
          totalVariants: task.totalVariants,
          error: msg,
        });
      }
    });
  }

  return NextResponse.json({ results, errors });
}
