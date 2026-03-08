import type { ImageFormat, FormatCategory } from "@/types";

export const IMAGE_FORMATS: ImageFormat[] = [
  // E-Commerce Product Listings
  {
    id: "amazon_main",
    label: "Amazon Main Image",
    category: "ecommerce",
    width: 2000,
    height: 2000,
    description: "Pure white background, product centered (1:1)",
    aspectRatio: "1:1",
  },
  {
    id: "amazon_gallery",
    label: "Amazon Gallery",
    category: "ecommerce",
    width: 1000,
    height: 1000,
    description: "Secondary product image (1:1)",
    aspectRatio: "1:1",
  },
  {
    id: "shopify_standard",
    label: "Shopify Standard",
    category: "ecommerce",
    width: 2048,
    height: 2048,
    description: "Shopify recommended product image (1:1)",
    aspectRatio: "1:1",
  },

  // A+ Content
  {
    id: "aplus_fullwidth",
    label: "A+ Full Width Banner",
    category: "aplus",
    width: 970,
    height: 600,
    description: "Full-width lifestyle/feature banner (970×600)",
    aspectRatio: "97:60",
  },
  {
    id: "aplus_halfwidth",
    label: "A+ Half Width Module",
    category: "aplus",
    width: 600,
    height: 300,
    description: "Half-width feature module (600×300)",
    aspectRatio: "2:1",
  },
  {
    id: "aplus_comparison",
    label: "A+ Comparison Chart",
    category: "aplus",
    width: 1464,
    height: 600,
    description: "Wide comparison/feature chart (1464×600)",
    aspectRatio: "61:25",
  },

  // Meta Performance Ads
  {
    id: "meta_feed_square",
    label: "Meta Feed (1:1)",
    category: "meta",
    width: 1080,
    height: 1080,
    description: "Facebook & Instagram feed square (1080×1080)",
    aspectRatio: "1:1",
  },
  {
    id: "meta_feed_portrait",
    label: "Meta Feed (4:5)",
    category: "meta",
    width: 1080,
    height: 1350,
    description: "Facebook & Instagram portrait (1080×1350)",
    aspectRatio: "4:5",
  },
  {
    id: "meta_stories",
    label: "Meta Stories / Reels (9:16)",
    category: "meta",
    width: 1080,
    height: 1920,
    description: "Stories & Reels full-screen (1080×1920)",
    aspectRatio: "9:16",
  },
  {
    id: "meta_landscape",
    label: "Meta Landscape (1.91:1)",
    category: "meta",
    width: 1200,
    height: 628,
    description: "Facebook landscape/link image (1200×628)",
    aspectRatio: "1.91:1",
  },

  // Google Display Ads
  {
    id: "google_medium_rect",
    label: "Medium Rectangle",
    category: "google",
    width: 300,
    height: 250,
    description: "Most common Google display ad (300×250)",
    aspectRatio: "6:5",
  },
  {
    id: "google_leaderboard",
    label: "Leaderboard",
    category: "google",
    width: 728,
    height: 90,
    description: "Top-of-page banner (728×90)",
    aspectRatio: "728:90",
  },
  {
    id: "google_wide_sky",
    label: "Wide Skyscraper",
    category: "google",
    width: 160,
    height: 600,
    description: "Sidebar tall ad (160×600)",
    aspectRatio: "4:15",
  },
  {
    id: "google_half_page",
    label: "Half Page",
    category: "google",
    width: 300,
    height: 600,
    description: "Large sidebar ad (300×600)",
    aspectRatio: "1:2",
  },
  {
    id: "google_large_rect",
    label: "Large Rectangle",
    category: "google",
    width: 336,
    height: 280,
    description: "Inline content ad (336×280)",
    aspectRatio: "6:5",
  },
  {
    id: "google_mobile_banner",
    label: "Mobile Banner",
    category: "google",
    width: 320,
    height: 50,
    description: "Mobile top/bottom banner (320×50)",
    aspectRatio: "32:5",
  },
];

export const CATEGORY_LABELS: Record<FormatCategory, string> = {
  ecommerce: "E-Commerce Product Listing",
  aplus: "A+ Content / Rich Media",
  meta: "Meta Performance Ads",
  google: "Google Display Ads",
};

export const CATEGORY_ICONS: Record<FormatCategory, string> = {
  ecommerce: "🛒",
  aplus: "⭐",
  meta: "📱",
  google: "🎯",
};

export const getFormatById = (id: string): ImageFormat | undefined =>
  IMAGE_FORMATS.find((f) => f.id === id);

export const getFormatsByCategory = (
  category: FormatCategory
): ImageFormat[] => IMAGE_FORMATS.filter((f) => f.category === category);

export const CATEGORIES: FormatCategory[] = [
  "ecommerce",
  "aplus",
  "meta",
  "google",
];
