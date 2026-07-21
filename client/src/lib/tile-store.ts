/**
 * IndexedDB Tile Storage
 *
 * Stores map tiles as Blobs in IndexedDB for offline use.
 * This approach avoids all Service Worker / Cache API issues on Safari/iOS.
 *
 * Based on the pattern used by leaflet.offline (github.com/allartk/leaflet.offline)
 */
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "tmb-offline-tiles";
const DB_VERSION = 1;
const STORE_NAME = "tiles";

export interface StoredTile {
  key: string; // normalized URL (always uses subdomain 'a' for consistent keys)
  blob: Blob;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | undefined;

/** Open (or create) the tile database */
function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Normalize a tile URL to a consistent key.
 * Leaflet uses subdomains a/b/c for load balancing, but we want
 * a single key per tile regardless of which subdomain was used.
 */
export function normalizeTileKey(url: string): string {
  return url.replace(/https:\/\/[abc]\.tile\.opentopomap\.org/, "https://a.tile.opentopomap.org");
}

/** Check if a tile exists in IndexedDB */
export async function hasTile(key: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.getKey(STORE_NAME, key);
  return result !== undefined;
}

/** Get a tile blob from IndexedDB */
export async function getTileBlob(key: string): Promise<Blob | undefined> {
  const db = await getDB();
  const record: StoredTile | undefined = await db.get(STORE_NAME, key);
  return record?.blob;
}

/** Save a tile blob to IndexedDB */
export async function saveTile(key: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, { key, blob, createdAt: Date.now() } satisfies StoredTile);
}

/** Get total number of stored tiles */
export async function getTileCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

/** Clear all stored tiles */
export async function clearAllTiles(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/** Estimate storage size in bytes (approximate based on tile count * avg tile size) */
export async function estimateStorageBytes(): Promise<number> {
  const count = await getTileCount();
  // Average OpenTopoMap tile is ~17KB
  return count * 17 * 1024;
}

/**
 * Get a tile image source for Leaflet.
 * If the tile is in IndexedDB, returns a blob: URL.
 * Otherwise returns the original network URL.
 */
export async function getTileImageSource(tileUrl: string): Promise<string> {
  const key = normalizeTileKey(tileUrl);
  const blob = await getTileBlob(key);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return tileUrl;
}
