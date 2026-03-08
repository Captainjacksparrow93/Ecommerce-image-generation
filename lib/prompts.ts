import type { ImageFormat, ProductDetails } from "@/types";

/**
 * Variation angle descriptors — each variant index gets a different shot
 * so multiple images of the same format look visually distinct.
 */
const ECOM_ANGLES = [
  "perfectly centred front-facing hero shot, product square to camera",
  "clean 30-degree three-quarter angle showing depth and side profile",
  "top-down flat-lay shot with product occupying the full frame",
  "close-up detail shot emphasising surface texture, finish, and build quality",
  "slight low-angle view (15° below centre) that gives the product an aspirational premium look",
];

const LIFESTYLE_ANGLES = [
  "primary lifestyle composition: product in natural use context, warm ambient lighting",
  "secondary lifestyle scene: product alongside complementary props, editorial style",
  "minimalist hero lifestyle: product on a textured surface with shallow depth of field",
  "in-context scene showing target customer benefiting from the product",
  "overhead flat-lay lifestyle with brand-appropriate props and colour palette",
];

const AD_ANGLES = [
  "bold hero product shot, high-contrast, designed to stop scroll",
  "dynamic product composition with energy and motion implied",
  "split-composition: product on one side, clean space for ad copy on the other",
  "close-up feature highlight shot focusing on the product's most compelling detail",
  "full-bleed product on a premium gradient background for maximum visual punch",
];

function getVariantAngle(
  type: "ecom" | "lifestyle" | "ad",
  variantIndex: number
): string {
  const pool =
    type === "ecom"
      ? ECOM_ANGLES
      : type === "lifestyle"
      ? LIFESTYLE_ANGLES
      : AD_ANGLES;
  return pool[variantIndex % pool.length];
}

export function buildGenerationPrompt(
  format: ImageFormat,
  product: ProductDetails,
  customPrefix?: string,
  variantIndex = 0
): string {
  const base = customPrefix ? `${customPrefix}\n\n` : "";
  const prompt = buildCategoryPrompt(format, product, variantIndex);
  return `${base}${prompt.trim()}`;
}

function productBlock(product: ProductDetails): string {
  return [
    `Product name: ${product.productName}`,
    product.brand ? `Brand: ${product.brand}` : null,
    `Description: ${product.description}`,
    product.features.filter(Boolean).length
      ? `Key features: ${product.features.filter(Boolean).join(" | ")}`
      : null,
    product.colorStyle ? `Color/finish: ${product.colorStyle}` : null,
    product.targetAudience ? `Target customer: ${product.targetAudience}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCategoryPrompt(
  format: ImageFormat,
  product: ProductDetails,
  variantIndex: number
): string {
  const info = productBlock(product);
  const dims = `${format.width}×${format.height}px`;

  switch (format.category) {
    case "ecommerce":
      return buildEcommercePrompt(product, info, dims, variantIndex);
    case "aplus":
      return buildAplusPrompt(format, product, info, dims, variantIndex);
    case "meta":
      return buildMetaPrompt(format, product, info, dims, variantIndex);
    case "google":
      return buildGooglePrompt(format, product, info, dims, variantIndex);
    default:
      return buildEcommercePrompt(product, info, dims, variantIndex);
  }
}

// ─── E-COMMERCE ────────────────────────────────────────────────────────────

function buildEcommercePrompt(
  product: ProductDetails,
  info: string,
  dims: string,
  variantIndex: number
): string {
  const angle = getVariantAngle("ecom", variantIndex);
  const material = product.colorStyle
    ? `faithfully reproduce the ${product.colorStyle} finish`
    : "faithfully reproduce the product's actual colour and material finish";

  return `
Generate an ultra-realistic, professional studio product photograph of ${product.productName} suitable for an Amazon or Shopify main listing.

SHOT COMPOSITION: ${angle}

BACKGROUND: Pure, seamless #FFFFFF white. No gradients, shadows, props, reflections, or secondary objects. Amazon-compliant pure white.

LIGHTING: Professional 3-point studio lighting — main softbox from upper-left, fill light from right at 50% power, subtle rim light from behind to separate product from background. Even, diffused, shadow-free.

PHOTOGRAPHIC QUALITY: Ultra-sharp focus throughout, photorealistic detail, 8K texture fidelity, accurate depth of field for a product shot (f/8–f/11), zero noise, zero artefacts. Shot as if on a Canon EOS R5 with a 100mm macro lens.

PRODUCT ACCURACY: ${material}. Every surface detail, label, seam, button, and texture must be hyper-realistic — this image must make a customer feel confident enough to purchase without physically inspecting the product.

FRAMING: Product fills 85–90% of the canvas, centred, with equal padding on all sides. No crop.

OUTPUT SIZE: ${dims}

STRICT RULES: No text, no watermarks, no overlays, no human hands, no background props. Pure product photography only.

${info}
`.trim();
}

// ─── A+ CONTENT ────────────────────────────────────────────────────────────

function buildAplusPrompt(
  format: ImageFormat,
  product: ProductDetails,
  info: string,
  dims: string,
  variantIndex: number
): string {
  const angle = getVariantAngle("lifestyle", variantIndex);
  const audience = product.targetAudience || "discerning consumers";
  const isComparison = format.id === "aplus_comparison";
  const isHalf = format.id === "aplus_halfwidth";

  if (isComparison) {
    return `
Generate a premium editorial lifestyle banner for ${product.productName} — A+ comparison/feature chart format.

SHOT: ${angle}

LAYOUT: Wide horizontal composition (${dims}). Left 50% shows the product in a clean, premium setting. Right 50% has a lighter tone (off-white or cream) suitable for overlaid feature comparison text.

STYLE: Premium editorial photography — evokes confidence, craftsmanship, and quality. ${audience} will respond to this image.

LIGHTING: Natural-look studio lighting. Soft diffused light with gentle dimension-adding shadows.

REALISM: Ultra-photorealistic. Every material, texture, and finish of ${product.productName} exactly as real life. Customers deciding to purchase must feel fully confident from this image alone.

OUTPUT SIZE: ${dims}

${info}
`.trim();
  }

  if (isHalf) {
    return `
Generate a striking, conversion-focused A+ module image for ${product.productName}.

SHOT: ${angle}

LAYOUT: Compact horizontal (${dims}). Product on one side, contextual lifestyle element on the other. Clean, uncluttered.

STYLE: Premium lifestyle photography. Aspirational yet attainable. Targeted at ${audience}.

REALISM: Ultra-photorealistic product with true-to-life material and colour rendering. Purchase-driving quality.

OUTPUT SIZE: ${dims}

${info}
`.trim();
  }

  return `
Generate a premium full-width A+ lifestyle banner for ${product.productName}.

SHOT: ${angle}

LAYOUT: Wide horizontal (${dims}). Cinematic, magazine-quality visual storytelling. The product is the clear hero. Leave 30–40% of the image with a lighter, less busy area suitable for overlaid headline text.

STYLE: High-end editorial / lifestyle photography. The image should communicate quality, desirability, and the lifestyle benefit of owning this product. Think flagship product page for a top-tier brand.

LIGHTING: Cinematic natural or studio-hybrid lighting. Rich, warm tones where appropriate. Correct exposure with proper shadow and highlight detail.

REALISM: Ultra-photorealistic — every material, texture, colour, and surface detail of ${product.productName} rendered with 8K photograph fidelity.

PROPS/ENVIRONMENT: Minimal, carefully chosen props that complement the product and appeal to ${audience}. No clutter.

OUTPUT SIZE: ${dims}

${info}
`.trim();
}

// ─── META ADS ───────────────────────────────────────────────────────────────

function buildMetaPrompt(
  format: ImageFormat,
  product: ProductDetails,
  info: string,
  dims: string,
  variantIndex: number
): string {
  const angle = getVariantAngle("ad", variantIndex);
  const audience = product.targetAudience || "social media users";

  if (format.id === "meta_stories") {
    return `
Generate a scroll-stopping, full-screen Instagram/Facebook Stories ad for ${product.productName}.

SHOT: ${angle}

FORMAT: Full vertical 9:16 (${dims}). Product prominently centred in the middle third.

SAFE ZONES: Top 15% and bottom 20% should be visually clean (single colour or soft gradient) for the story UI and CTA button. Product must NOT enter these zones.

VISUAL STYLE: Bold, high-energy, premium social advertising. Vibrant, on-brand colour palette that stops scroll. Think Nike or Apple Stories ads.

PRODUCT: Ultra-photorealistic ${product.productName} — true colour, texture, finish. Must look desirable, real, and high quality. This image must trigger "Shop Now" behaviour in ${audience}.

BACKGROUND: Dynamic, brand-appropriate — gradient, lifestyle scene, or textured surface. Must complement, not distract from, the product.

OUTPUT SIZE: ${dims}

${info}
`.trim();
  }

  if (format.id === "meta_landscape") {
    return `
Generate a high-impact Facebook/Instagram landscape ad for ${product.productName}.

SHOT: ${angle}

FORMAT: 1.91:1 landscape (${dims}). Product occupies the left-centre. Right 35% is clean for ad copy overlay.

VISUAL STYLE: Premium performance advertising. High-contrast, eye-catching, conversion-optimised.

PRODUCT: Hyper-realistic ${product.productName} — colour, material, texture all accurately rendered. Purchase-triggering visual quality for ${audience}.

OUTPUT SIZE: ${dims}

${info}
`.trim();
  }

  const isPortrait = format.id === "meta_feed_portrait";
  return `
Generate a premium ${isPortrait ? "portrait (4:5)" : "square (1:1)"} Instagram/Facebook feed ad for ${product.productName}.

SHOT: ${angle}

FORMAT: ${dims}. Product occupies approximately 60–70% of the frame with breathing room around it.

VISUAL STYLE: High-end product-forward social ad. Bold composition that commands attention in a crowded feed. Aspirational but authentic — makes a user stop scrolling and want to learn more.

PRODUCT REALISM: Ultra-photorealistic ${product.productName}. Accurate colour gamut, surface texture, material sheen, and proportions. Zero artistic distortion. Must look like an actual photograph of the real product.

BACKGROUND: Clean, contextually relevant — minimal studio setup, curated lifestyle environment, or bold brand-appropriate colour/gradient.

PURCHASE INTENT: The composition must immediately communicate the product's key value proposition visually. A viewer should understand why they want this product within 1 second. Targeted at ${audience}.

SAFE AREA: Subtle low-contrast zone (~15% at bottom) for optional text overlay without obscuring the product.

OUTPUT SIZE: ${dims}

${info}
`.trim();
}

// ─── GOOGLE DISPLAY ─────────────────────────────────────────────────────────

function buildGooglePrompt(
  format: ImageFormat,
  product: ProductDetails,
  info: string,
  dims: string,
  variantIndex: number
): string {
  const angle = getVariantAngle("ad", variantIndex);

  if (
    format.id === "google_leaderboard" ||
    format.id === "google_mobile_banner"
  ) {
    const isMobile = format.id === "google_mobile_banner";
    return `
Generate a clean, high-impact ${isMobile ? "mobile banner" : "leaderboard banner"} display ad for ${product.productName}.

SHOT: ${angle}

FORMAT: Extremely wide, short horizontal banner (${dims}). Product on the LEFT occupying no more than 40% width. Right side is clean, light-toned, for headline + CTA text overlay.

VISUAL STYLE: Professional display advertising. Immediately scannable at small sizes. High contrast between product and background. Light or white background preferred.

PRODUCT: Ultra-realistic ${product.productName} — crisp, sharp, accurate. Must look great even at small banner size.

OUTPUT SIZE: ${dims}

${info}
`.trim();
  }

  if (
    format.id === "google_wide_sky" ||
    format.id === "google_half_page"
  ) {
    return `
Generate a premium vertical skyscraper display ad for ${product.productName}.

SHOT: ${angle}

FORMAT: Tall, narrow vertical ad (${dims}). Product prominently in the upper 60%. Lower 30% is clean (light or white) for text and CTA overlay.

VISUAL STYLE: Clean, authoritative display advertising. High visual clarity in narrow sidebar placement.

PRODUCT: Hyper-realistic ${product.productName} — accurate colour, material, and proportions. Sharp focus, zero artefacts.

OUTPUT SIZE: ${dims}

${info}
`.trim();
  }

  return `
Generate a clean, high-conversion Google Display Network ad for ${product.productName}.

SHOT: ${angle}

FORMAT: Rectangle display ad (${dims}). Product is the dominant visual element (55–65% of frame). Clean surrounding space for headline text overlay.

VISUAL STYLE: Professional display advertising — clean, crisp, immediately legible. White or very light background for maximum readability.

PRODUCT: Ultra-photorealistic ${product.productName}. True colour and material accuracy. Sharp and visually compelling even at display ad sizes.

PURCHASE INTENT: Must communicate product quality and desirability in a split second — minimal, focused, and persuasive.

OUTPUT SIZE: ${dims}

${info}
`.trim();
}
