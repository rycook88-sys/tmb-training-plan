/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope;

// Auto-update: take control immediately
self.skipWaiting();
clientsClaim();

// Clean up old caches from previous versions
cleanupOutdatedCaches();

// Also clean up the old tile cache from the SW-based approach
caches.delete("tmb-map-tiles-v1");

// Precache static assets (injected by VitePWA at build time)
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching for Google Fonts only
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

// NOTE: Map tiles are NOT handled by the Service Worker.
// They are stored in IndexedDB and served via a custom Leaflet TileLayer.
// This avoids all Safari/iOS cache.put() issues and SW interception flashing.
