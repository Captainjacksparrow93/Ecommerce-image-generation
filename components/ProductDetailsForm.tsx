"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductDetails } from "@/types";

interface Props {
  value: ProductDetails;
  onChange: (details: ProductDetails) => void;
  disabled?: boolean;
}

export default function ProductDetailsForm({ value, onChange, disabled }: Props) {
  const set = (field: keyof ProductDetails, val: string | string[]) => {
    onChange({ ...value, [field]: val });
  };

  const addFeature = () => {
    set("features", [...value.features, ""]);
  };

  const updateFeature = (index: number, text: string) => {
    const updated = [...value.features];
    updated[index] = text;
    set("features", updated);
  };

  const removeFeature = (index: number) => {
    set(
      "features",
      value.features.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.productName}
            onChange={(e) => set("productName", e.target.value)}
            disabled={disabled}
            placeholder="e.g. Premium Wireless Headphones"
            className={inputClass}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Brand
          </label>
          <input
            type="text"
            value={value.brand}
            onChange={(e) => set("brand", e.target.value)}
            disabled={disabled}
            placeholder="e.g. Sony, Nike, Generic"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Product Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          disabled={disabled}
          placeholder="Describe the product — material, use case, benefits, unique selling points..."
          rows={4}
          className={cn(inputClass, "resize-none")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Color / Style
          </label>
          <input
            type="text"
            value={value.colorStyle}
            onChange={(e) => set("colorStyle", e.target.value)}
            disabled={disabled}
            placeholder="e.g. Midnight Black, Rose Gold"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Target Audience
          </label>
          <input
            type="text"
            value={value.targetAudience}
            onChange={(e) => set("targetAudience", e.target.value)}
            disabled={disabled}
            placeholder="e.g. Young professionals, Gamers"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Key Features
          </label>
          <button
            type="button"
            onClick={addFeature}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add feature
          </button>
        </div>

        <div className="space-y-2">
          {value.features.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-600 italic">
              No features added. Click &quot;Add feature&quot; to add key product points.
            </p>
          )}
          {value.features.map((feature, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeature(idx, e.target.value)}
                disabled={disabled}
                placeholder={`Feature ${idx + 1}...`}
                className={cn(inputClass, "flex-1")}
              />
              <button
                type="button"
                onClick={() => removeFeature(idx)}
                disabled={disabled}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed";
