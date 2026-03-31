// Offline Map Tile Caching for TMB area
// Pre-downloads OpenTopoMap tiles for the TMB region so the map works without internet

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
    // Consider cached if we have at least 90% of tiles
    return keys.length >= tileCount * 0.9;
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

// Download and cache all tiles with progress callback
export async function downloadTiles(
  onProgress: (downloaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const tiles = getTileList();
  const total = tiles.length;
  const cache = await caches.open(CACHE_NAME);
  let downloaded = 0;
  let errors = 0;

  // Download in batches to avoid overwhelming the browser
  const BATCH_SIZE = 10;

  for (let i = 0; i < tiles.length; i += BATCH_SIZE) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const batch = tiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        // Check if already cached
        const existing = await cache.match(url);
        if (existing) return;

        const response = await fetch(url, { signal });
        if (response.ok) {
          await cache.put(url, response);
        }
      })
    );

    results.forEach((r) => {
      if (r.status === "rejected") errors++;
    });

    downloaded += batch.length;
    onProgress(Math.min(downloaded, total), total);
  }

  if (errors > total * 0.1) {
    throw new Error(`Too many failed downloads: ${errors}/${total}`);
  }
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
