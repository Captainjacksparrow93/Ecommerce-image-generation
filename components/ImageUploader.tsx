"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onImageSelected: (file: File, preview: string) => void;
  preview: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export default function ImageUploader({
  onImageSelected,
  preview,
  onClear,
  disabled,
}: Props) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelected(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    disabled,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    onDropAccepted: () => setDragOver(false),
  });

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-violet-200 dark:border-violet-800 bg-white dark:bg-gray-900 shadow-lg">
        <img
          src={preview}
          alt="Product preview"
          className="w-full h-72 object-contain p-4"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
            ✓ Uploaded
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer",
        "flex flex-col items-center justify-center h-72 gap-4",
        "bg-gray-50 dark:bg-gray-900",
        isDragActive || dragOver
          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 scale-[1.01]"
          : "border-gray-300 dark:border-gray-700 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          "rounded-full p-5 transition-colors",
          isDragActive
            ? "bg-violet-100 dark:bg-violet-900"
            : "bg-gray-100 dark:bg-gray-800"
        )}
      >
        {isDragActive ? (
          <ImageIcon className="w-10 h-10 text-violet-500" />
        ) : (
          <Upload className="w-10 h-10 text-gray-400" />
        )}
      </div>
      <div className="text-center">
        {isDragActive ? (
          <p className="text-violet-600 dark:text-violet-400 font-semibold text-lg">
            Drop your product image here
          </p>
        ) : (
          <>
            <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">
              Upload Product Image
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Drag & drop or{" "}
              <span className="text-violet-600 dark:text-violet-400 underline">
                browse files
              </span>
            </p>
          </>
        )}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600">
        JPG, PNG, WebP — up to 10MB
      </p>
    </div>
  );
}
