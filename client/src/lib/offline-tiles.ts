/**
 * Offline Map Tile Caching for TMB area
 *
 * Stores tiles as Blobs in IndexedDB for offline use.
 * This approach avoids all Service Worker / Cache API issues on Safari/iOS.
 * Based on the pattern used by leaflet.offline (github.com/allartk/leaflet.offline).
 *
 * When online: Leaflet loads tiles from the network as normal (zero interception).
 * When offline: The custom TileLayer checks IndexedDB first and uses blob: URLs.
 */

import {
  normalizeTileKey,
  saveTile,
  getTileCount as getStoredCount,
  clearAllTiles,
  hasTile,
} from "./tile-store";

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

// Check if tiles are already cached in IndexedDB
export async function isCached(): Promise<boolean> {
  try {
    const storedCount = await getStoredCount();
    const totalNeeded = getTileCount();
    // Consider cached if we have at least 80% of tiles
    return storedCount >= totalNeeded * 0.8;
  } catch {
    return false;
  }
}

// Get cached tile count from IndexedDB
export async function getCachedCount(): Promise<number> {
  try {
    return await getStoredCount();
  } catch {
    return 0;
  }
}

/**
 * Download all tiles and store them in IndexedDB.
 * Fetches tiles directly from page JavaScript and stores as Blobs.
 * No Service Worker involvement — IndexedDB works perfectly on all browsers.
 */
export async function downloadTiles(
  onProgress: (downloaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const tiles = getTileList();
  const total = tiles.length;
  let downloaded = 0;
  let errors = 0;

  // Process in batches to avoid overwhelming the browser
  const BATCH_SIZE = 6;

  for (let i = 0; i < tiles.length; i += BATCH_SIZE) {
    // Check for abort
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const batch = tiles.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (url) => {
        const key = normalizeTileKey(url);

        try {
          // Skip if already stored
          const exists = await hasTile(key);
          if (exists) {
            downloaded++;
            return;
          }

          // Fetch the tile as a blob
          const response = await fetch(url);
          if (!response.ok) {
            errors++;
            return;
          }

          const blob = await response.blob();
          await saveTile(key, blob);
          downloaded++;
        } catch {
          errors++;
        }
      })
    );

    onProgress(downloaded + errors, total);
  }

  // Allow up to 15% failures
  if (errors > total * 0.15) {
    throw new Error(`Too many failed downloads: ${errors}/${total}. Saved: ${downloaded}/${total}`);
  }

  onProgress(total, total);
}

// Clear cached tiles from IndexedDB
export async function clearTileCache(): Promise<void> {
  await clearAllTiles();
  // Also clean up the old Cache API cache if it exists from previous versions
  try {
    await caches.delete("tmb-map-tiles-v1");
  } catch {
    // ignore
  }
}

// Estimate cache size in MB
export function estimateSizeMB(): number {
  const tileCount = getTileCount();
  // Average OpenTopoMap tile is ~15-20KB
  return Math.round((tileCount * 17) / 1024);
}
