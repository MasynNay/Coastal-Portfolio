import { createArtCache } from "../art";
const scenery = [
  "runner-temple",
  "runner-floor",
  "runner-water-aura",
  "runner-air",
  "runner-water",
  "runner-fire",
  "runner-earth",
  "runner-crate",
  "runner-rail",
  "runner-arch",
];
// Keep this game's finite set of images until it closes or the costume changes.
// The loader's LRU budget is smaller than the complete set: relying on it while
// playing could silently evict obstacles or power-ups as another image decodes.
// Retaining Image references does not create additional decoded pixel copies.
export function createRunnerArt(
  asset,
  cache = createArtCache({ maxBytes: 24 * 1024 * 1024 }),
) {
  const images = new Map(),
    ids = [asset, asset.replace(/-run$/, "-board-trick"), ...scenery];
  let disposed = false;
  return {
    get: (id) => images.get(id),
    load: () =>
      Promise.all(
        ids.map(async (id) => {
          const image = await cache.load(id);
          if (!disposed) images.set(id, image);
        }),
      ).then(() => cache.clear()),
    clear() {
      disposed = true;
      images.clear();
      cache.clear();
    },
  };
}
