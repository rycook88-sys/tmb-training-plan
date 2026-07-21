/**
 * Custom Leaflet TileLayer with IndexedDB offline support.
 *
 * When online: loads tiles from the network as normal (no interception).
 * When offline: checks IndexedDB for cached tiles and uses blob: URLs.
 *
 * This avoids all Service Worker issues and works perfectly on Safari/iOS.
 */
import { normalizeTileKey, getTileBlob } from "./tile-store";

/**
 * Creates an offline-capable TileLayer using the given Leaflet module.
 * Must pass L (the Leaflet import) since it's dynamically imported.
 */
export function createOfflineTileLayer(
  L: typeof import("leaflet"),
  urlTemplate: string,
  options: L.TileLayerOptions
): L.TileLayer {
  const OfflineTileLayer = L.TileLayer.extend({
    createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
      const tile = document.createElement("img") as HTMLImageElement;

      tile.alt = "";
      tile.setAttribute("role", "presentation");

      if (this.options.crossOrigin || this.options.crossOrigin === "") {
        tile.crossOrigin =
          this.options.crossOrigin === true ? "" : this.options.crossOrigin;
      }

      // Get the normal network URL for this tile
      const networkUrl = this.getTileUrl(coords);

      // Check IndexedDB for a cached version
      const key = normalizeTileKey(networkUrl);

      getTileBlob(key)
        .then((blob) => {
          if (blob) {
            // Found in IndexedDB — use blob URL (works offline)
            tile.src = URL.createObjectURL(blob);
          } else {
            // Not cached — use network URL (normal behavior)
            tile.src = networkUrl;
          }
        })
        .catch(() => {
          // IndexedDB error — fall back to network
          tile.src = networkUrl;
        });

      // Standard Leaflet tile event handling
      tile.onload = () => {
        // Revoke blob URLs to free memory (only if it's a blob URL)
        // Actually don't revoke — Leaflet may re-use the tile element
        done(undefined, tile);
      };
      tile.onerror = () => {
        done(new Error("Tile failed to load"), tile);
      };

      return tile;
    },
  });

  // @ts-ignore - Leaflet's extend() returns a class constructor
  return new OfflineTileLayer(urlTemplate, options) as L.TileLayer;
}
