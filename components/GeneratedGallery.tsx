"use client";

import { useState } from "react";
import { Download, PackageOpen, ZoomIn, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { getFormatById } from "@/lib/formats";
import type { GenerationResult } from "@/types";

interface Props {
  results: GenerationResult[];
}

export default function GeneratedGallery({ results }: Props) {
  const [lightbox, setLightbox] = useState<{
    results: GenerationResult[];
    idx: number;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);

  const successful = results.filter((r) => r.image && !r.error);
  const failed = results.filter((r) => r.error);

  const downloadSingle = (result: GenerationResult) => {
    const suffix =
      result.totalVariants > 1 ? `_v${result.variantIndex + 1}` : "";
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${result.image}`;
    link.download = `${result.formatId}${suffix}_${result.width}x${result.height}.png`;
    link.click();
  };

  const downloadAll = async () => {
    if (successful.length === 0) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("ecom-creatives");
      for (const result of successful) {
        const suffix =
          result.totalVariants > 1 ? `_v${result.variantIndex + 1}` : "";
        const bytes = atob(result.image);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        folder?.file(
          `${result.formatId}${suffix}_${result.width}x${result.height}.png`,
          arr
        );
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ecom-creatives.zip";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  // Group results: category → formatId → variants[]
  type GroupedResults = Record<string, Record<string, GenerationResult[]>>;

  const grouped: GroupedResults = {};
  for (const result of results) {
    const format = getFormatById(result.formatId);
    const cat = format?.category || "other";
    if (!grouped[cat]) grouped[cat] = {};
    if (!grouped[cat][result.formatId]) grouped[cat][result.formatId] = [];
    grouped[cat][result.formatId].push(result);
  }

  // Sort variants within each format by variantIndex
  for (const cat of Object.keys(grouped)) {
    for (const fid of Object.keys(grouped[cat])) {
      grouped[cat][fid].sort((a, b) => a.variantIndex - b.variantIndex);
    }
  }

  const CATEGORY_NAMES: Record<string, string> = {
    ecommerce: "🛒 E-Commerce",
    aplus: "⭐ A+ Content",
    meta: "📱 Meta Ads",
    google: "🎯 Google Display",
  };

  const lightboxResult = lightbox
    ? lightbox.results[lightbox.idx]
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Generated Creatives
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {successful.length} image{successful.length !== 1 ? "s" : ""} generated
            {failed.length > 0 && `, ${failed.length} failed`}
          </p>
        </div>
        {successful.length > 1 && (
          <button
            onClick={downloadAll}
            disabled={downloading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
              "bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm",
              downloading && "opacity-70 cursor-not-allowed"
            )}
          >
            <PackageOpen className="w-4 h-4" />
            {downloading ? "Zipping…" : `Download All (${successful.length} images)`}
          </button>
        )}
      </div>

      {/* Failed alerts */}
      {failed.length > 0 && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {failed.length} generation{failed.length > 1 ? "s" : ""} failed
              </p>
              <ul className="mt-1 space-y-0.5">
                {failed.map((r, i) => (
                  <li key={`${r.formatId}-${i}`} className="text-xs text-red-600 dark:text-red-400">
                    • {r.label}
                    {r.totalVariants > 1 ? ` (variant ${r.variantIndex + 1})` : ""}:{" "}
                    {r.error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Gallery — category → format group → variant strip */}
      {Object.entries(grouped).map(([category, formatGroups]) => (
        <div key={category} className="space-y-5">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {CATEGORY_NAMES[category] || category}
          </h3>

          <div className="space-y-5">
            {Object.entries(formatGroups).map(([formatId, variants]) => {
              const format = getFormatById(formatId);
              const hasMultiple = variants.length > 1;

              return (
                <div key={formatId} className="space-y-2">
                  {/* Format label row */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {format?.label || formatId}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-600">
                      {format?.width}×{format?.height}
                    </span>
                    {hasMultiple && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                        {variants.length} variants
                      </span>
                    )}
                  </div>

                  {/* Variant grid */}
                  <div
                    className={cn(
                      "grid gap-3",
                      variants.length === 1
                        ? "grid-cols-1 max-w-sm"
                        : variants.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    )}
                  >
                    {variants.map((result) => (
                      <ImageCard
                        key={`${result.formatId}-${result.variantIndex}`}
                        result={result}
                        showVariantBadge={hasMultiple}
                        onZoom={() => {
                          if (!result.error) {
                            const successfulVariants = variants.filter(
                              (v) => v.image && !v.error
                            );
                            setLightbox({
                              results: successfulVariants,
                              idx: successfulVariants.findIndex(
                                (v) => v.variantIndex === result.variantIndex
                              ),
                            });
                          }
                        }}
                        onDownload={() => downloadSingle(result)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      {lightbox && lightboxResult && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev / Next for multi-variant */}
            {lightbox.results.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            idx:
                              (prev.idx - 1 + prev.results.length) %
                              prev.results.length,
                          }
                        : null
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            idx: (prev.idx + 1) % prev.results.length,
                          }
                        : null
                    )
                  }
                  className="absolute right-12 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image */}
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-950 min-h-0">
              <img
                src={`data:image/png;base64,${lightboxResult.image}`}
                alt={lightboxResult.label}
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {lightboxResult.label}
                  {lightboxResult.totalVariants > 1 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      Variant {lightboxResult.variantIndex + 1} of{" "}
                      {lightbox.results.length}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lightboxResult.width}×{lightboxResult.height}px
                </p>
              </div>
              <button
                onClick={() => downloadSingle(lightboxResult)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageCard({
  result,
  showVariantBadge,
  onZoom,
  onDownload,
}: {
  result: GenerationResult;
  showVariantBadge: boolean;
  onZoom: () => void;
  onDownload: () => void;
}) {
  const hasImage = !!(result.image && !result.error);

  return (
    <div
      className={cn(
        "group rounded-2xl border overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow",
        result.error
          ? "border-red-200 dark:border-red-800"
          : "border-gray-200 dark:border-gray-700"
      )}
    >
      {/* Image area */}
      <div
        className="relative bg-gray-50 dark:bg-gray-800 overflow-hidden cursor-pointer"
        style={{
          paddingBottom: `${Math.min(80, (result.height / result.width) * 100)}%`,
        }}
        onClick={onZoom}
      >
        {hasImage ? (
          <>
            <img
              src={`data:image/png;base64,${result.image}`}
              alt={result.label}
              className="absolute inset-0 w-full h-full object-contain p-2"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-1" />
              <p className="text-xs text-red-500">Failed</p>
            </div>
          </div>
        )}

        {/* Variant badge */}
        {showVariantBadge && (
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded-md",
                hasImage
                  ? "bg-black/50 text-white"
                  : "bg-red-500/70 text-white"
              )}
            >
              V{result.variantIndex + 1}
            </span>
          </div>
        )}
      </div>

      {/* Download row */}
      {hasImage && (
        <div className="flex items-center justify-end px-2 py-1.5 border-t border-gray-100 dark:border-gray-700/50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 px-2 py-1 rounded-lg transition-colors"
          >
            <Download className="w-3 h-3" />
            Save
          </button>
        </div>
      )}
    </div>
  );
}
