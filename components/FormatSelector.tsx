"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IMAGE_FORMATS,
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  getFormatsByCategory,
} from "@/lib/formats";
import type { FormatCategory, FormatQuantities } from "@/types";

interface Props {
  selections: FormatQuantities; // { formatId: quantity }
  onChange: (selections: FormatQuantities) => void;
  disabled?: boolean;
}

const MAX_QTY = 5;
const MIN_QTY = 1;

export default function FormatSelector({
  selections,
  onChange,
  disabled,
}: Props) {
  const [expanded, setExpanded] = useState<Set<FormatCategory>>(
    new Set<FormatCategory>(["ecommerce", "meta"])
  );

  const selectedIds = Object.keys(selections).filter(
    (id) => (selections[id] ?? 0) > 0
  );

  const totalImages = Object.values(selections).reduce(
    (sum, q) => sum + (q ?? 0),
    0
  );

  const isSel = (id: string) => (selections[id] ?? 0) > 0;

  const toggle = (id: string) => {
    if (isSel(id)) {
      const next = { ...selections };
      delete next[id];
      onChange(next);
    } else {
      onChange({ ...selections, [id]: 1 });
    }
  };

  const setQty = (id: string, qty: number) => {
    const clamped = Math.max(MIN_QTY, Math.min(MAX_QTY, qty));
    onChange({ ...selections, [id]: clamped });
  };

  const toggleCategory = (category: FormatCategory) => {
    const formats = getFormatsByCategory(category).map((f) => f.id);
    const allSelected = formats.every((id) => isSel(id));
    if (allSelected) {
      const next = { ...selections };
      formats.forEach((id) => delete next[id]);
      onChange(next);
    } else {
      const next = { ...selections };
      formats.forEach((id) => { if (!next[id]) next[id] = 1; });
      onChange(next);
    }
  };

  const toggleExpanded = (category: FormatCategory) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const selectAll = () => {
    const next: FormatQuantities = {};
    IMAGE_FORMATS.forEach((f) => { next[f.id] = selections[f.id] || 1; });
    onChange(next);
  };
  const clearAll = () => onChange({});

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {selectedIds.length} format{selectedIds.length !== 1 ? "s" : ""}
          </span>
          {totalImages > 0 && (
            <span className="bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {totalImages} image{totalImages !== 1 ? "s" : ""} total
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
          >
            Select all
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-gray-500 hover:underline disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Category groups */}
      {CATEGORIES.map((category) => {
        const formats = getFormatsByCategory(category);
        const catSelCount = formats.filter((f) => isSel(f.id)).length;
        const allSelected = catSelCount === formats.length;
        const someSelected = catSelCount > 0 && !allSelected;
        const isOpen = expanded.has(category);

        return (
          <div
            key={category}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Category header */}
            <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => !disabled && toggleCategory(category)}
                disabled={disabled}
                className="flex items-center gap-2.5 flex-1 text-left"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    allSelected
                      ? "bg-violet-600 border-violet-600"
                      : someSelected
                      ? "bg-violet-200 border-violet-400 dark:bg-violet-900 dark:border-violet-600"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                >
                  {allSelected && <Check className="w-3 h-3 text-white" />}
                  {someSelected && (
                    <div className="w-2 h-0.5 bg-violet-600 dark:bg-violet-400 rounded" />
                  )}
                </div>
                <span className="text-base">{CATEGORY_ICONS[category]}</span>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto mr-2">
                  {catSelCount}/{formats.length}
                </span>
              </button>
              <button
                onClick={() => toggleExpanded(category)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Format rows */}
            {isOpen && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {formats.map((format) => {
                  const sel = isSel(format.id);
                  const qty = selections[format.id] ?? 1;

                  return (
                    <div
                      key={format.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-colors",
                        sel
                          ? "bg-violet-50 dark:bg-violet-950/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/30",
                        disabled && "opacity-50"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => !disabled && toggle(format.id)}
                        disabled={disabled}
                        className="flex-shrink-0"
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                            sel
                              ? "bg-violet-600 border-violet-600"
                              : "border-gray-300 dark:border-gray-600"
                          )}
                        >
                          {sel && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </button>

                      {/* Format info */}
                      <button
                        onClick={() => !disabled && toggle(format.id)}
                        disabled={disabled}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {format.label}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {format.width}×{format.height}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {format.description}
                        </p>
                      </button>

                      {/* Aspect ratio thumbnail */}
                      <div
                        className="flex-shrink-0 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                        style={{
                          width: Math.min(22, 22 * (format.width / Math.max(format.width, format.height))),
                          height: Math.min(22, 22 * (format.height / Math.max(format.width, format.height))),
                        }}
                      />

                      {/* Quantity stepper — only visible when selected */}
                      <div
                        className={cn(
                          "flex items-center gap-0.5 flex-shrink-0 transition-all duration-200",
                          sel ? "opacity-100" : "opacity-0 w-0 overflow-hidden pointer-events-none"
                        )}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); if (!disabled) setQty(format.id, qty - 1); }}
                          disabled={disabled || qty <= MIN_QTY}
                          className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                            qty > MIN_QTY
                              ? "text-gray-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-600"
                              : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          )}
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="w-6 text-center text-sm font-bold text-violet-700 dark:text-violet-300 tabular-nums">
                          {qty}
                        </span>

                        <button
                          onClick={(e) => { e.stopPropagation(); if (!disabled) setQty(format.id, qty + 1); }}
                          disabled={disabled || qty >= MAX_QTY}
                          className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                            qty < MAX_QTY
                              ? "text-gray-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-600"
                              : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          )}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {selectedIds.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
          Tap <span className="font-semibold">−</span> /{" "}
          <span className="font-semibold">+</span> to set how many variations
          per format (max {MAX_QTY} each)
        </p>
      )}
    </div>
  );
}
