"use client";

import { useState, useEffect } from "react";
import { Loader2, Wand2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  originalImage: string;
  onRemoved: (transparentBase64: string) => void;
  autoRun?: boolean;
}

type Status = "idle" | "loading" | "done" | "error";

export default function BackgroundRemover({
  originalImage,
  onRemoved,
  autoRun = true,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [transparentPreview, setTransparentPreview] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string>("");

  const removeBackground = async () => {
    setStatus("loading");
    setError("");
    try {
      const { removeBackground: removeBg } = await import(
        "@imgly/background-removal"
      );

      const blob = await removeBg(originalImage, {
        output: {
          format: "image/png",
          quality: 0.95,
        },
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        setTransparentPreview(dataUrl);
        setStatus("done");
        onRemoved(base64);
      };
      reader.readAsDataURL(blob);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Background removal failed");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (autoRun && originalImage && status === "idle") {
      removeBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage, autoRun]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Background Removal
        </span>
        {status === "loading" && (
          <Loader2 className="w-4 h-4 text-violet-500 animate-spin ml-auto" />
        )}
        {status === "done" && (
          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
        )}
        {status === "error" && (
          <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
        )}
      </div>

      {status === "loading" && (
        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-4 text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">
            Removing background...
          </p>
          <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
            Processing in your browser — no data sent to servers
          </p>
        </div>
      )}

      {status === "done" && transparentPreview && (
        <div className="rounded-xl overflow-hidden border-2 border-green-200 dark:border-green-800 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABh0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABKSURBVDiNY2RgYPj/n4GBgYGJgYGBgZGBgYGRgYGBkZGBgZGJgYGBiZGBgZGRiYGBkZGJgYGRkYmBgZGRiYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgYGBkZGJgQEA6F8K5KeT+YMAAAAASUVORK5CYII=')] bg-repeat">
          <img
            src={transparentPreview}
            alt="Background removed"
            className="w-full h-48 object-contain"
          />
        </div>
      )}

      {status === "done" && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Background removed successfully — transparent PNG ready
        </p>
      )}

      {status === "error" && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Background removal failed
          </p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <button
            onClick={removeBackground}
            className="mt-2 text-xs bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {status === "idle" && !autoRun && (
        <button
          onClick={removeBackground}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl",
            "bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm",
            "transition-colors shadow-sm"
          )}
        >
          <Wand2 className="w-4 h-4" />
          Remove Background
        </button>
      )}
    </div>
  );
}
