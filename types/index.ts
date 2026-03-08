export interface ImageFormat {
  id: string;
  label: string;
  category: FormatCategory;
  width: number;
  height: number;
  description: string;
  aspectRatio: string;
}

export type FormatCategory =
  | "ecommerce"
  | "aplus"
  | "meta"
  | "google";

export interface ProductDetails {
  productName: string;
  brand: string;
  description: string;
  features: string[];
  colorStyle: string;
  targetAudience: string;
}

/** Map of formatId → quantity to generate (e.g. { "amazon_main": 3, "meta_feed_square": 1 }) */
export type FormatQuantities = Record<string, number>;

export interface GenerationRequest {
  image: string; // base64 PNG with transparent background
  product: ProductDetails;
  /** New: per-format quantities */
  formatQuantities: FormatQuantities;
  customPromptPrefix?: string;
}

export interface GenerationResult {
  formatId: string;
  label: string;
  width: number;
  height: number;
  image: string; // base64
  /** 0-based variant index within this format */
  variantIndex: number;
  /** Total variants requested for this format */
  totalVariants: number;
  error?: string;
}

export interface GenerationResponse {
  results: GenerationResult[];
  errors?: { formatId: string; variantIndex: number; message: string }[];
}

export interface AppSettings {
  geminiApiKey: string;
  adminPassword: string;
  defaultModel: string;
  maxConcurrentGenerations: number;
  customPromptPrefix: string;
  watermarkText: string;
}
