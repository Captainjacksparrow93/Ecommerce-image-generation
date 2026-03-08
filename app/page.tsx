"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Settings,
  Loader2,
  AlertCircle,
  RotateCcw,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";
import BackgroundRemover from "@/components/BackgroundRemover";
import ProductDetailsForm from "@/components/ProductDetailsForm";
import FormatSelector from "@/components/FormatSelector";
import GeneratedGallery from "@/components/GeneratedGallery";
import type { ProductDetails, GenerationResult, FormatQuantities } from "@/types";

type Step = "upload" | "form" | "generating" | "results";

/** Resize + compress a base64 PNG to JPEG ≤1024px for API transport.
 *  Keeps the image well under Vercel's 4.5 MB request body limit. */
async function compressForApi(
  base64: string,
  maxPx = 1024,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = `data:image/png;base64,${base64}`;
  });
}

const EMPTY_PRODUCT: ProductDetails = {
  productName: "",
  brand: "",
  description: "",
  features: [],
  colorStyle: "",
  targetAudience: "",
};

const DEFAULT_SELECTIONS: FormatQuantities = {
  amazon_main: 1,
  meta_feed_square: 1,
  meta_feed_portrait: 1,
};

const AUTO_GENERATE_DELAY = 4; // seconds

export default function Home() {
  const [step, setStep] = useState<Step>("upload");

  // Image state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transparentBase64, setTransparentBase64] = useState<string | null>(null);
  const [bgRemoved, setBgRemoved] = useState(false);

  // Form state
  const [product, setProduct] = useState<ProductDetails>(EMPTY_PRODUCT);
  const [selections, setSelections] = useState<FormatQuantities>(DEFAULT_SELECTIONS);

  // Auto-generate countdown
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTriggeredRef = useRef(false);

  // Results
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [generateError, setGenerateError] = useState("");
  const [generating, setGenerating] = useState(false);

  const totalImages = Object.values(selections).reduce((s, q) => s + q, 0);

  const canGenerate =
    !!transparentBase64 &&
    !!product.productName.trim() &&
    !!product.description.trim() &&
    totalImages > 0;

  // ─── Auto-generate logic ─────────────────────────────────────────────────
  useEffect(() => {
    if (
      canGenerate &&
      !generating &&
      step === "form" &&
      results.length === 0 &&
      !autoTriggeredRef.current
    ) {
      setAutoCountdown(AUTO_GENERATE_DELAY);
    } else if (!canGenerate || step !== "form") {
      clearCountdown();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGenerate, generating, step, results.length]);

  useEffect(() => {
    if (autoCountdown === null) return;
    if (autoCountdown === 0) {
      clearCountdown();
      if (canGenerate && !generating) {
        autoTriggeredRef.current = true;
        generate();
      }
      return;
    }
    countdownRef.current = setInterval(() => {
      setAutoCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCountdown]);

  function clearCountdown() {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setAutoCountdown(null);
  }
  function cancelAutoGenerate() { clearCountdown(); autoTriggeredRef.current = true; }

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleImageSelected = useCallback(
    (_file: File, preview: string) => {
      setOriginalImage(preview);
      setBgRemoved(false);
      setTransparentBase64(null);
      autoTriggeredRef.current = false;
      clearCountdown();
      if (step === "upload") setStep("form");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step]
  );

  const handleBgRemoved = useCallback((base64: string) => {
    setTransparentBase64(base64);
    setBgRemoved(true);
  }, []);

  const clearImage = () => {
    setOriginalImage(null);
    setTransparentBase64(null);
    setBgRemoved(false);
    clearCountdown();
    autoTriggeredRef.current = false;
    setStep("upload");
  };

  const generate = async () => {
    if (!canGenerate) return;
    clearCountdown();
    setGenerating(true);
    setGenerateError("");
    setStep("generating");
    try {
      // Compress to ≤1024px JPEG before sending — keeps payload well under Vercel's 4.5 MB limit
      const compressedImage = await compressForApi(transparentBase64!);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedImage, product, formatQuantities: selections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResults(data.results || []);
      setStep("results");
    } catch (err: unknown) {
      const e = err as Error;
      setGenerateError(e.message);
      setStep("form");
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setStep("upload"); setOriginalImage(null); setTransparentBase64(null);
    setBgRemoved(false); setProduct(EMPTY_PRODUCT); setSelections(DEFAULT_SELECTIONS);
    setResults([]); setGenerateError(""); clearCountdown(); autoTriggeredRef.current = false;
  };

  const regenerate = () => { setResults([]); autoTriggeredRef.current = false; setStep("form"); };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50 dark:from-gray-950 dark:via-violet-950/20 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-violet-600 rounded-xl p-1.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">EcomCreatives</span>
              <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 ml-2">AI Product Image Generator</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === "results" && (
              <>
                <button onClick={regenerate} className="flex items-center gap-1.5 px-3 py-2 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-xl transition-colors font-medium">
                  <Zap className="w-4 h-4" />Regenerate
                </button>
                <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                  <RotateCcw className="w-4 h-4" />New
                </button>
              </>
            )}
            <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <Settings className="w-4 h-4" /><span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {step === "results" && results.length > 0 && (
          <div className="animate-in fade-in duration-300">
            <GeneratedGallery results={results} />
          </div>
        )}

        {step === "generating" && <GeneratingScreen totalImages={totalImages} />}

        {step !== "results" && step !== "generating" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader step={1} title="Product Image" done={!!originalImage} />
                <div className="space-y-4">
                  <ImageUploader onImageSelected={handleImageSelected} preview={originalImage} onClear={clearImage} disabled={generating} />
                  {originalImage && <BackgroundRemover originalImage={originalImage} onRemoved={handleBgRemoved} autoRun />}
                </div>
              </Card>

              {originalImage && (
                <Card>
                  <CardHeader step={2} title="Product Details" done={!!product.productName.trim() && !!product.description.trim()} />
                  <ProductDetailsForm
                    value={product}
                    onChange={(p) => { setProduct(p); autoTriggeredRef.current = false; }}
                    disabled={generating}
                  />
                </Card>
              )}
            </div>

            {/* Right */}
            <div className="lg:col-span-3 space-y-5">
              <Card>
                <CardHeader step={3} title="Output Formats & Quantities" done={totalImages > 0} />
                <FormatSelector
                  selections={selections}
                  onChange={(s) => { setSelections(s); autoTriggeredRef.current = false; }}
                  disabled={generating}
                />
              </Card>

              {generateError && (
                <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Generation failed</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{generateError}</p>
                  </div>
                </div>
              )}

              {/* Auto-generate countdown banner */}
              {autoCountdown !== null && canGenerate && (
                <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 tabular-nums">
                    {autoCountdown}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                      Auto-generating {totalImages} image{totalImages !== 1 ? "s" : ""}…
                    </p>
                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                      All fields complete. Tap <strong>Now</strong> to start immediately.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { clearCountdown(); generate(); }} className="text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                      Now
                    </button>
                    <button onClick={cancelAutoGenerate} className="p-1.5 text-violet-400 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-lg transition-colors" title="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={generate}
                disabled={!canGenerate || generating}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-sm",
                  canGenerate && !generating
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                )}
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Generating…</>
                ) : (
                  <><Sparkles className="w-5 h-5" />Generate {totalImages > 0 ? `${totalImages} Image${totalImages !== 1 ? "s" : ""}` : "Images"}</>
                )}
              </button>

              {!canGenerate && !generating && (
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Complete these to generate</p>
                  <CheckItem done={!!originalImage} label="Upload a product image" />
                  <CheckItem done={bgRemoved} label="Background removal complete" />
                  <CheckItem done={!!product.productName.trim()} label="Product name" />
                  <CheckItem done={!!product.description.trim()} label="Product description" />
                  <CheckItem done={totalImages > 0} label="At least one format selected" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-gray-400 dark:text-gray-600">
          <span>Powered by Google Gemini AI</span>
          <Link href="/admin" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Admin Settings</Link>
        </div>
      </footer>
    </div>
  );
}

function GeneratingScreen({ totalImages }: { totalImages: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold text-gray-900 dark:text-white">Generating your creatives…</p>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Creating {totalImages} photorealistic image{totalImages !== 1 ? "s" : ""} with Gemini AI
        </p>
        <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">
          Each image is individually prompted for max quality — this may take 30–90s
        </p>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: Math.min(totalImages, 8) }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-violet-400 dark:bg-violet-600 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
        {totalImages > 8 && <span className="text-xs text-gray-400 self-center ml-1">+{totalImages - 8}</span>}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">{children}</div>;
}

function CardHeader({ step, title, done }: { step: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors", done ? "bg-green-500 text-white" : "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400")}>
        {done ? "✓" : step}
      </div>
      <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0", done ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700")}>
        {done && <span className="text-xs">✓</span>}
      </div>
      <span className={cn("text-sm", done ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-700 dark:text-gray-300")}>{label}</span>
    </div>
  );
}
