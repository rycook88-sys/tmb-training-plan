/**
 * Coach Sierra photo library — 20 AI-generated photos with varied expressions and outfits.
 * Photos rotate randomly in the chat to feel natural and alive.
 */

export interface SierraPhoto {
  url: string;
  /** Short description for alt text */
  desc: string;
}

export const SIERRA_PHOTOS: SierraPhoto[] = [
  // Batch 1: Black tank top, alpine ridge, golden hour
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-01_432128d8.png", desc: "Warm smile, black tank top, alpine ridge at golden hour" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-02_311ee796.png", desc: "Laughing, black tank top, mountain trail" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-03_9dfbdd10.png", desc: "Focused expression, black tank top, dramatic peaks" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-04_3b38444a.png", desc: "Playful smirk, black tank top, sunset ridge" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-05_f11ecf25.png", desc: "Encouraging nod, black tank top, alpine meadow" },

  // Batch 2: Different angles and expressions
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-06_11660be7.png", desc: "Over-the-shoulder look, black tank top, mountain vista" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-07_7d9d737a.png", desc: "Candid laughing, relaxed pose" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-08_270007f1.png", desc: "Determined look, dramatic cloudy sky" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-09_d303bc2a.png", desc: "Sitting by stream, looking up at camera" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-10_9892d606.png", desc: "Side profile at sunset, windswept hair" },

  // Batch 3: Different expressions continued
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-11_7f8608b0.png", desc: "Gentle smile, soft morning light" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-12_d1ce2a71.png", desc: "Big grin, mountain hut deck" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-13_e7532a0f.png", desc: "Thoughtful expression, looking away" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-14_bf8c453f.png", desc: "Proud expression, arms crossed" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-15_b96cc97a.png", desc: "Waving, cheerful greeting" },

  // Batch 4: Different outfits
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-16_01115573.png", desc: "White crop top, alpine meadow with wildflowers" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-17_1c1e3130.png", desc: "Burgundy athletic jacket, misty morning trail" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-18_0439dd21.png", desc: "Olive flannel shirt, European mountain village" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-19_b456d752.png", desc: "Blue sundress, Italian cafe with espresso" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663340412157/kg646KsucyUqS5q5xNwGcx/sierra-lib-20_7ebe982c.png", desc: "Navy henley, mountain hut deck at sunset" },
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
