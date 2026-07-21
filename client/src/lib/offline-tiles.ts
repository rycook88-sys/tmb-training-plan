// Offline Map Tile Caching for TMB area
// Pre-downloads OpenTopoMap tiles for the TMB region so the map works offline.
//
// Strategy: Send tile URLs to the Service Worker via postMessage.
// The SW fetches and caches them directly inside the worker context.
// This avoids Safari/iOS issues with cache.put() from page JavaScript.

const CACHE_NAME = "tmb-map-tiles-v1";

// TMB bounding box (covers the entire trail + Mont Blanc)
const BOUNDS = {
  minLat: 45.65,
  maxLat: 46.10,
  minLng: 6.70,
  maxLng: 7.15,
};

// Zoom levels to cache (10 = overview, 14 = trail detail)
const ZOOM_LEVELS = [10, 11, 12, 13, 14];

const TILE_URL_TEMPLATE = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
const SUBDOMAINS = ["a", "b", "c"];

// Convert lat/lng to tile coordinates
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

// Get all tile URLs for the TMB area at all zoom levels
export function getTileList(): string[] {
  const tiles: string[] = [];
  let subIdx = 0;

  for (const zoom of ZOOM_LEVELS) {
    const topLeft = latLngToTile(BOUNDS.maxLat, BOUNDS.minLng, zoom);
    const bottomRight = latLngToTile(BOUNDS.minLat, BOUNDS.maxLng, zoom);

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        const s = SUBDOMAINS[subIdx % SUBDOMAINS.length];
        subIdx++;
        const url = TILE_URL_TEMPLATE
          .replace("{s}", s)
          .replace("{z}", zoom.toString())
          .replace("{x}", x.toString())
          .replace("{y}", y.toString());
        tiles.push(url);
      }
    }
  }

  return tiles;
}

// Get total tile count for progress display
export function getTileCount(): number {
  return getTileList().length;
}

// Check if tiles are already cached
export async function isCached(): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const tileCount = getTileCount();
    // Consider cached if we have at least 80% of tiles
    return keys.length >= tileCount * 0.8;
  } catch {
    return false;
  }
}

// Get cached tile count
export async function getCachedCount(): Promise<number> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

// Get the active service worker (controller or waiting)
async function getServiceWorker(): Promise<ServiceWorker | null> {
  if (!("serviceWorker" in navigator)) return null;

  const reg = await navigator.serviceWorker.ready;

  // Prefer the active controller
  if (navigator.serviceWorker.controller) {
    return navigator.serviceWorker.controller;
  }

  // Fall back to active worker from registration
  if (reg.active) {
    return reg.active;
  }

  return null;
}

// Download all tiles by sending them to the Service Worker for caching.
// The SW does the actual fetch + cache.put inside the worker context,
// which avoids Safari's restrictions on page-level cache writes.
export async function downloadTiles(
  onProgress: (downloaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const tiles = getTileList();
  const total = tiles.length;

  // Get the service worker
  const sw = await getServiceWorker();

  if (!sw) {
    throw new Error("Service Worker not available. Please reload the page and try again.");
  }

  // Generate a unique batch ID for this download session
  const batchId = `tiles-${Date.now()}`;

  // Set up a promise that resolves when the SW reports completion
  return new Promise<void>((resolve, reject) => {
    let completed = false;

    // Listen for progress/completion messages from the SW
    const messageHandler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.batchId !== batchId) return;

      if (data.type === "CACHE_TILES_PROGRESS") {
        onProgress(data.cached + data.errors, total);
      }

      if (data.type === "CACHE_TILES_COMPLETE") {
        completed = true;
        navigator.serviceWorker.removeEventListener("message", messageHandler);

        // Allow up to 15% failures
        if (data.errors > total * 0.15) {
          reject(new Error(`Too many failed downloads: ${data.errors}/${total}. Cached: ${data.cached}/${total}`));
        } else {
          onProgress(total, total);
          resolve();
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", messageHandler);

    // Handle abort
    if (signal) {
      signal.addEventListener("abort", () => {
        if (!completed) {
          navigator.serviceWorker.removeEventListener("message", messageHandler);
          reject(new DOMException("Aborted", "AbortError"));
        }
      });
    }

    // Send ALL tiles to SW in a single message
    // The SW processes them internally in batches of 8
    sw.postMessage({
      type: "CACHE_TILES",
      urls: tiles,
      batchId,
    });

    // Safety timeout — if SW never responds within 5 minutes, fail
    setTimeout(() => {
      if (!completed) {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
        reject(new Error("Download timed out. The service worker did not respond."));
      }
    }, 5 * 60 * 1000);
  });
}

// Clear cached tiles
export async function clearTileCache(): Promise<void> {
  await caches.delete(CACHE_NAME);
}

// Estimate cache size in MB
export function estimateSizeMB(): number {
  const tileCount = getTileCount();
  // Average OpenTopoMap tile is ~15-20KB
  return Math.round((tileCount * 17) / 1024);
}
