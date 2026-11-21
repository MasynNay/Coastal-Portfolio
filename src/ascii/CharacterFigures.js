import figures from "./CharacterFrames.json";
const tokens =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";

// Preserve the source silhouette and pose; only the display medium changes to
// colored characters. Geometry is sampled in cell space, never drawn as an image.
// Text contrast is lifted for dark outlines without bleaching costume colors.
function textColor(rgb) {
  // Tiny terminal glyphs cover less area than a solid pixel. Gamma compensation
  // keeps green cloth, brown hair and dark outlines readable on the dark stage.
  const color = rgb.map((v) => 255 * Math.pow(v / 255, 0.62));
  const brightness = 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
  const lift = Math.max(0, 88 - brightness);
  return color.map((v) => Math.min(255, Math.round(v + lift)));
}
const materials = Object.fromEntries(
  Object.entries(figures).map(([id, figure]) => [
    id,
    figure.palette.map((rgb) => {
      const light = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return {
        color: textColor(rgb),
        glyph: light < 120 ? "@" : light < 200 ? "#" : "+",
      };
    }),
  ]),
);
export function hasCharacterFigure(id) {
  return !!figures[id];
}
export function drawCharacterFigure(grid, creature, scene) {
  const figure = figures[creature.kind];
  if (!figure) return false;
  const index = creature.seed - 1,
    water = ["cove", "springs"].includes(scene.style.setting);
  const main = index === 0,
    count = scene.creatures.length;
  const solo = count === 1 || scene.creatures[1]?.kind === "fairy";
  const maxWidth =
    grid.columns *
    (water
      ? 0.29
      : solo
        ? 0.64
        : main
          ? count === 3
            ? 0.4
            : 0.54
          : count === 3
            ? 0.23
            : 0.28);
  const targetHeight = Math.min(
    grid.rows * (water ? 0.32 : main ? 0.68 : 0.46),
    (maxWidth * figure.height) / figure.width,
  );
  const targetWidth = (targetHeight * figure.width) / figure.height;
  const left = creature.x * grid.columns - targetWidth / 2;
  const bottom =
    (water ? creature.y + 0.12 : main ? 0.86 : 0.9) * grid.rows +
    Math.sin(scene.time * 1.2 + index) * 0.25;
  let phase = (scene.time * 1000) % figure.durations.reduce((a, b) => a + b, 0),
    frameIndex = 0;
  while (
    phase >= figure.durations[frameIndex] &&
    frameIndex < figure.frames.length - 1
  )
    phase -= figure.durations[frameIndex++];
  const frame = figure.frames[frameIndex];
  for (let y = 0; y < Math.ceil(targetHeight); y++) {
    const row =
      frame[
        Math.min(
          figure.height - 1,
          Math.floor((y / targetHeight) * figure.height),
        )
      ];
    for (let x = 0; x < Math.ceil(targetWidth); x++) {
      const source = Math.min(
        figure.width - 1,
        Math.floor((x / targetWidth) * figure.width),
      );
      const token =
        row[creature.direction < 0 ? figure.width - 1 - source : source];
      if (!token || token === " ") continue;
      const material = materials[creature.kind][tokens.indexOf(token)];
      grid.put(
        left + x,
        bottom - targetHeight + y,
        material.glyph,
        material.color,
      );
    }
  }
  return true;
}
