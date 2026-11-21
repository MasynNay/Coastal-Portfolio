import { drawStoryScenery } from "./StoryScenery";
// Simple, deliberate silhouettes leave a clear foreground for the main figure.
// Rain, drifting lanterns, cloud ribbons and butterflies provide gentle motion.
export function drawStoryLandscape(grid, scene) {
  if (drawStoryScenery(grid, scene)) return true;
  const { setting, water, plant, accent } = scene.style;
  if (!["totoro-garden", "bathhouse", "air-temple", "shire"].includes(setting))
    return false;
  const { columns: w, rows: h, put, line, oval, polygon } = grid;
  const box = (x, y, width, height, color) =>
    polygon(
      [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
      ],
      color,
    );
  for (let i = 0; i < 65; i++) {
    const x = (((i * 31) % 179) / 179) * w,
      y = (((i * 17) % 59) / 59) * h;
    if (i % 3 === 0) put(x, y, ".", [73, 107, 118]);
  }
  if (setting === "totoro-garden") {
    for (const x of [w * 0.08, w * 0.89]) {
      box(x - 2, h * 0.1, 4, h * 0.78, [111, 103, 80]);
      oval(x, h * 0.14, 12, 7, plant);
      oval(x, h * 0.25, 10, 5, [65, 130, 106]);
      for (let i = 0; i < 6; i++)
        line(x, h * 0.82, x - 8 + i * 3, h * 0.9, [111, 103, 80], "/");
    }
    for (let i = 0; i < 10; i++) {
      const t = scene.time * 0.6 + i,
        x = w * (0.08 + i * 0.091),
        y = h * (0.4 + Math.sin(t) * 0.15);
      put(x, y, Math.sin(t * 2) > 0.2 ? "*" : ".", [218, 231, 148]);
    }
    // Smaller white and blue spirits accompany the main forest visitor.
    for (const [x, c] of [
      [w * 0.27, [191, 226, 220]],
      [w * 0.73, [111, 184, 204]],
    ]) {
      oval(x, h * 0.8, 4, 4, c);
      line(x - 2, h * 0.76, x - 2, h * 0.7, c, "|");
      line(x + 2, h * 0.76, x + 2, h * 0.7, c, "|");
      put(x - 1, h * 0.79, "o", water);
      put(x + 1, h * 0.79, "o", water);
    }
  } else if (setting === "bathhouse") {
    for (let floor = 0; floor < 3; floor++) {
      const y = h * (0.09 + floor * 0.09),
        x = w * (0.08 - floor * 0.01),
        width = w * (0.28 + floor * 0.02);
      box(x, y, width, h * 0.07, [129, 76, 85]);
      polygon(
        [
          [x - 3, y],
          [x + width * 0.5, y - 3],
          [x + width + 3, y],
        ],
        [120, 141, 130],
      );
      for (let j = 0; j < 5; j++)
        box(x + 3 + (j * width) / 5, y + 1, 2, 1, accent);
    }
    for (const x of [w * 0.12, w * 0.83]) {
      line(x, h * 0.12, x, h * 0.63, [134, 106, 96], "|");
      oval(x, h * 0.39, 3, 3, accent);
      line(x, h * 0.43, x, h * 0.47, accent, ":");
    }
    // A red bridge and its railing run beneath the visitor's feet.
    for (let x = w * 0.1; x < w * 0.9; x++) {
      const y = h * 0.88 - Math.sin(((x / w - 0.1) / 0.8) * Math.PI) * 2;
      put(x, y, "=", [162, 94, 107]);
      if (Math.round(x) % 6 === 0)
        line(x, y - 2, x, y + 1, [162, 94, 107], "|");
    }
  } else if (setting === "air-temple") {
    for (let i = 0; i < 5; i++)
      oval(
        ((i * 0.24 + scene.time * 0.008) % 1) * w,
        h * (0.16 + (i % 3) * 0.1),
        14,
        2,
        [83, 124, 146],
      );
    for (const x of [w * 0.12, w * 0.85]) {
      polygon(
        [
          [x - 8, h * 0.82],
          [x - 3, h * 0.33],
          [x + 4, h * 0.33],
          [x + 9, h * 0.82],
        ],
        [104, 132, 136],
      );
      box(x - 3, h * 0.22, 7, h * 0.18, [196, 166, 130]);
      polygon(
        [
          [x - 7, h * 0.22],
          [x, h * 0.13],
          [x + 8, h * 0.22],
        ],
        [148, 111, 100],
      );
      line(x, h * 0.26, x, h * 0.31, [65, 101, 117], "|");
    }
  } else {
    oval(w * 0.2, h * 0.26, w * 0.17, h * 0.17, plant);
    oval(w * 0.2, h * 0.27, 7, 6, [49, 103, 78]);
    oval(w * 0.2, h * 0.27, 5.5, 5, [87, 152, 102]);
    put(w * 0.22, h * 0.29, "o", accent);
    for (const x of [w * 0.08, w * 0.32]) {
      oval(x, h * 0.25, 2, 2, accent);
      put(x, h * 0.25, "+", water);
    }
    line(w * 0.2, h * 0.39, w * 0.27, h * 0.52, [169, 155, 116], ":");
    for (let i = 0; i < 14; i++) {
      const x = w * (0.04 + i * 0.07);
      line(x, h * 0.91, x, h * 0.86, plant, "|");
      put(x, h * 0.85, "*", i % 2 ? accent : [221, 153, 187]);
    }
  }
  return true;
}
