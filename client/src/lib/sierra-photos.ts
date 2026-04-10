/**
 * Coach Sierra photo library — 20 AI-generated photos with varied outfits, settings, and vibes.
 * Every photo features a different look. Photos rotate randomly in chat.
 */

export interface SierraPhoto {
  url: string;
  /** Short description for alt text */
  desc: string;
}

export const SIERRA_PHOTOS: SierraPhoto[] = [
  // Active / Athletic
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-01-gym-kxnJfW5rczfA7yVbKhYtRR.webp", desc: "Charcoal sports bra, dumbbell curls in the gym" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-02-running-TW8hgGXa8zMG6TGuKHmyae.webp", desc: "Coral running tank, coastal trail at sunrise" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-03-yoga-bqcgwAZ2AfcdhXFt2KBt4Z.webp", desc: "Sage green crop top, yoga warrior pose at dawn" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-04-hiking-action-3zZ5R5mKeFq9fpW2v5wUFr.webp", desc: "Rust-orange tee, trekking poles in the Swiss Alps" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-05-climbing-RN8Xept7rZuMDMrnUEkTzt.webp", desc: "Teal racerback, indoor climbing wall" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-11-stretch-AEegmNL3ZNBfaggGtudLTT.webp", desc: "Lavender tank, post-workout floor stretch" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-15-boxing-5V7RBgKHts7csUAqq73N9A.webp", desc: "Black crop top, red boxing gloves, heavy bag" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-20-cycling-fncjjPN2nQ7Sm8Dcywrgao.webp", desc: "White and navy cycling jersey, mountain road" },

  // Spicy / Stylish
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-06-nightout-5jGH7rBgLJQzJJiL9pcZ8Q.webp", desc: "Deep red satin cocktail dress, rooftop bar at night" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-07-leather-hsAHKSgARDXQPhknzd3vbc.webp", desc: "Black leather moto jacket, urban alley" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-08-beach-6KN4SAREspP4kYErcQ29P8.webp", desc: "Navy bikini top and denim cutoffs, golden hour beach" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-09-lbd-ah7EfSNAUQgYh3RgHrmtCZ.webp", desc: "Black off-shoulder dress, candlelit dinner" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-18-gala-JgrhKsFpGPne6ujqVXTxKi.webp", desc: "Emerald green velvet dress, gold earrings, gala" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-13-pool-2xmvwhquButvhaZnnuewHk.webp", desc: "Black one-piece swimsuit, infinity pool with mountains" },

  // Casual / Lifestyle
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-10-linen-b3dBVG7voUu6vakwCGkXUe.webp", desc: "White linen shirt, European cobblestone street" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-12-coffee-EyNxYyatV3ywornjfqmmwM.webp", desc: "Cream cable-knit sweater, cozy cafe with latte" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-16-wine-KKW2yipwdhia9p4kiQx6u6.webp", desc: "Dusty rose sundress, wine at vineyard sunset" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-17-campfire-g6WozePyBGXE8GYo7S37bz.webp", desc: "Denim jacket over burgundy henley, campfire at dusk" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-19-morning-fW9BTzSCwhNxZEAcXzKjEv.webp", desc: "Plaid flannel shirt, coffee in bed, morning light" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-14-summit-YqTrXwzZPdydLPQcSAAoCG.webp", desc: "Yellow windbreaker, arms raised on mountain summit" },
];

/**
 * Get a random Sierra photo. Uses a simple index tracker to avoid
 * showing the same photo twice in a row.
 */
let lastIndex = -1;
export function getRandomSierraPhoto(): SierraPhoto {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * SIERRA_PHOTOS.length);
  } while (idx === lastIndex && SIERRA_PHOTOS.length > 1);
  lastIndex = idx;
  return SIERRA_PHOTOS[idx];
}

/**
 * Get a Sierra photo by index (for deterministic assignment to messages).
 */
export function getSierraPhotoByIndex(messageIndex: number): SierraPhoto {
  return SIERRA_PHOTOS[messageIndex % SIERRA_PHOTOS.length];
}
