import coastArt from "./CoastArt.json";
import gameArt from "./GameArt.json";
import beachArt from "./BeachArt.json";
import { imageSource } from "./ImageSource";
import manifest from "./spriteManifest.json";
import spriteSheets from "./SpriteSheets.json";
import places from "./PlaceArt.json";
import terrain from "./TerrainArt.json";
import { spriteFrame } from "./animation";
const rawArtwork = {
  ...gameArt,
  "totoro-grove": {
    src: "/world/places/totoro-grove.svg",
    cw: 240,
    ch: 160,
    columns: 4,
    rows: 1,
    frameMs: 220,
  },
  ...beachArt,
  ...coastArt,
  ...manifest,
  ...spriteSheets,
  ...places,
  ...terrain.props,
  ...(terrain.ground
    ? {
        "garden-tiles": terrain.ground,
      }
    : {}),
  ...(terrain.tiles
    ? {
        "terrain-tiles": terrain.tiles,
      }
    : {}),
  link: spriteSheets.link,
};
export const artwork = Object.fromEntries(
  Object.entries(rawArtwork).map(([id, sheet]) => [
    id,
    {
      ...sheet,
      id,
    },
  ]),
);
// Decode only requested artwork and retain a bounded set of recently used
// images. Costume/activity changes must not accumulate hundreds of decoded
// atlases during a long visit. The browser can still cache their small PNGs.
export function createArtCache({ maxBytes = 192 * 1024 * 1024 } = {}) {
  const images = new Map(),
    pending = new Map();
  let usedBytes = 0,
    generation = 0;
  function get(key) {
    const item = images.get(key);
    if (!item) return undefined;
    images.delete(key);
    images.set(key, item);
    return item.image;
  }
  function retain(key, image, data) {
    const width =
      image.naturalWidth ||
      image.width ||
      data.cw * (data.columns || 1) ||
      data.width ||
      1;
    const height =
      image.naturalHeight ||
      image.height ||
      data.ch * (data.rows || 1) ||
      data.height ||
      1;
    const bytes = width * height * 4;
    images.set(key, { image, bytes });
    usedBytes += bytes;
    // Always keep the image just requested, including a single oversized atlas.
    // Everything else is evicted oldest-first; drawing an image refreshes it.
    while (usedBytes > maxBytes && images.size > 1) {
      const oldest = images.keys().next().value;
      usedBytes -= images.get(oldest).bytes;
      images.delete(oldest);
    }
  }
  return {
    get: (id) => get(imageSource(artwork[id] || { src: "" })),
    async load(id) {
      const data = artwork[id];
      const key = data && imageSource(data);
      if (images.has(key)) return get(key);
      if (pending.has(key)) return pending.get(key);
      if (!data) throw new Error(`Missing world artwork: ${id}`);
      const started = generation;
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = async () => {
          try {
            await image.decode();
          } catch {
            /* onload is sufficient in older browsers. */
          }
          if (generation === started) retain(key, image, data);
          resolve(image);
        };
        image.onerror = () => reject(new Error(`Could not load ${data.src}`));
        image.src = imageSource(data);
      });
      pending.set(key, promise);
      try {
        return await promise;
      } finally {
        // Resolved promises otherwise retain their decoded image forever,
        // defeating eviction. Do not delete a newer request after clear().
        if (pending.get(key) === promise) pending.delete(key);
      }
    },
    clear() {
      generation++;
      images.clear();
      pending.clear();
      usedBytes = 0;
    },
  };
}
export function drawSprite(
  ctx,
  image,
  sheet,
  x,
  y,
  height,
  direction,
  moving,
  time,
) {
  const width = Math.round(
    (height * (sheet.cw || sheet.width)) / (sheet.ch || sheet.height),
  );
  const frame = spriteFrame(sheet, direction, moving, time);
  const originY =
    sheet.baselines?.[frame.row * (sheet.columns || 4) + frame.column] ??
    sheet.footY;
  const baseline = originY ? originY / sheet.ch : 1;
  ctx.save();
  ctx.translate(x, y);
  const anchor =
    sheet.anchors?.[frame.row * (sheet.columns || 4) + frame.column] ??
    sheet.cw / 2;
  const left = sheet.bodyOnly ? Math.max(0, anchor - 13) : 0;
  const right = sheet.bodyOnly ? Math.min(sheet.cw, anchor + 13) : sheet.cw;
  if (frame.flip) ctx.scale(-1, 1);
  const region = sheet.cw
    ? [
        frame.column * sheet.cw + left,
        frame.row * sheet.ch,
        right - left,
        sheet.ch,
        (-(anchor - left) * width) / sheet.cw,
        -height * baseline,
        ((right - left) * width) / sheet.cw,
        height,
      ]
    : [-width / 2, -height, width, height];
  // Downscaling a thin, opaque outline with smoothing introduces translucent
  // edge pixels. A crisp pass of this SAME frame supplies solid coverage,
  // then the normal smooth pass preserves facial/cloth detail. No extra image
  // is allocated or cached. Explicit effect fades keep their original opacity.
  if (sheet.opaqueBody && ctx.globalAlpha === 1 && ctx.imageSmoothingEnabled) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, ...region);
    ctx.imageSmoothingEnabled = true;
  }
  ctx.drawImage(image, ...region);
  ctx.restore();
}
