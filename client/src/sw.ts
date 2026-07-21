/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope;

// Auto-update: take control immediately
self.skipWaiting();
clientsClaim();

// Clean up old caches from previous versions
cleanupOutdatedCaches();

// Precache static assets (injected by VitePWA at build time)
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching for OpenTopoMap tiles
// Use NetworkFirst so tiles always load fresh when online (no flashing/stale tiles).
// The cache is only used as fallback when offline — which is the whole point of the
// bulk download feature.
const TILE_CACHE_NAME = "tmb-map-tiles-v1";

registerRoute(
  /^https:\/\/[abc]\.tile\.opentopomap\.org\/.*/i,
  new NetworkFirst({
    cacheName: TILE_CACHE_NAME,
    networkTimeoutSeconds: 3, // Fall back to cache after 3s if offline/slow
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1200,
        maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  "GET"
);

// Runtime caching for Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
  "GET"
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: "gstatic-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
  "GET"
);

// ─── MESSAGE HANDLER: Bulk tile download ───────────────────────────────────
// The page sends a message with type "CACHE_TILES" and an array of URLs.
// We fetch and cache them directly inside the SW — this avoids Safari's
// restriction on cache.put() from page JavaScript.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_TILES") {
    const urls: string[] = event.data.urls;
    const batchId: string = event.data.batchId || "default";

    handleTileCaching(urls, batchId, event.source as Client);
  }
});

async function handleTileCaching(urls: string[], batchId: string, client: Client | null) {
  const cache = await caches.open(TILE_CACHE_NAME);
  let cached = 0;
  let errors = 0;

  // Process in small batches inside the SW
  const BATCH = 8;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          // Check if already cached
          const existing = await cache.match(url);
          if (existing) {
            cached++;
            return;
          }
          // Fetch and cache
          const response = await fetch(url);
          if (response.ok || response.type === "opaque") {
            await cache.put(url, response);
            cached++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      })
    );

    // Report progress back to the page
    if (client) {
      client.postMessage({
        type: "CACHE_TILES_PROGRESS",
        batchId,
        cached,
        errors,
        total: urls.length,
      });
    }
  }

  // Final completion message
  if (client) {
    client.postMessage({
      type: "CACHE_TILES_COMPLETE",
      batchId,
      cached,
      errors,
      total: urls.length,
    });
  }
}
