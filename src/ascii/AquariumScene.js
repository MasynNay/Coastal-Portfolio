// Aquariums are drawn entirely with monospace characters, not sprite images.
// The model owns movement and feeding; the renderer only reads it. Keeping
// simulation time separate from wall time prevents jumps after minimizing.
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (color) => `rgb(${color.join(",")})`;
const GOLD = [247, 178, 72];
const CORAL = [246, 128, 154];
const BLUE = [94, 192, 235];
const SILVER = [167, 217, 214];

export const aquariumStyles = [
  {
    id: "river",
    name: "River Garden",
    description:
      "A sunlit freshwater garden. Tetras school through ribbon plants and a little turtle takes the scenic route.",
    water: [9, 29, 38],
    plant: [83, 161, 120],
    accent: [150, 211, 167],
    bed: [101, 130, 109],
    animals: [
      "tetra",
      "tetra",
      "tetra",
      "tetra",
      "goldfish",
      "goldfish",
      "turtle",
    ],
    landscape: "plants",
  },
  {
    id: "reef",
    name: "Coral Cathedral",
    description:
      "Clownfish, striped reef fish, and a sea turtle weave through a garden of branching coral.",
    water: [8, 28, 52],
    plant: [219, 113, 160],
    accent: [128, 220, 216],
    bed: [159, 151, 132],
    animals: [
      "clownfish",
      "clownfish",
      "angelfish",
      "angelfish",
      "tang",
      "turtle",
      "tetra",
    ],
    landscape: "coral",
  },
  {
    id: "moon",
    name: "Moonlit Lagoon",
    description:
      "Lavender jellyfish pulse under moonlight. Silver fish drift past soft, swaying seagrass.",
    water: [12, 17, 42],
    plant: [104, 120, 176],
    accent: [191, 176, 238],
    bed: [92, 104, 139],
    animals: [
      "jelly",
      "jelly",
      "jelly",
      "silver",
      "silver",
      "silver",
      "turtle",
    ],
    landscape: "plants",
  },
  {
    id: "kelp",
    name: "Amber Kelp Forest",
    description:
      "Golden ribbons of kelp, curious seahorses, and warm shoals in the late afternoon light.",
    water: [10, 31, 35],
    plant: [148, 161, 83],
    accent: [230, 190, 112],
    bed: [112, 128, 100],
    animals: [
      "seahorse",
      "seahorse",
      "goldfish",
      "silver",
      "silver",
      "turtle",
      "goldfish",
    ],
    landscape: "kelp",
  },
  {
    id: "deep",
    name: "Midnight Glow",
    description:
      "A deep-sea dream: luminous jellyfish, tiny lantern fish, and bioluminescent coral.",
    water: [5, 12, 29],
    plant: [76, 124, 170],
    accent: [124, 230, 230],
    bed: [66, 80, 115],
    animals: [
      "jelly",
      "jelly",
      "jelly",
      "lantern",
      "lantern",
      "lantern",
      "lantern",
    ],
    landscape: "coral",
  },
  {
    id: "pokemon",
    name: "Pokémon Cove",
    description:
      "Magikarp splash, Horsea bob, and a familiar blue sea traveler glides through a playful pocket-sized reef.",
    water: [9, 26, 49],
    plant: [93, 158, 164],
    accent: [153, 213, 246],
    bed: [132, 151, 157],
    animals: ["magikarp", "magikarp", "horsea", "horsea", "lapras", "magikarp"],
    landscape: "coral",
  },
];

export function createAquarium(style = aquariumStyles[0]) {
  return {
    style,
    time: 0,
    food: [],
    fed: 0,
    creatures: style.animals.map((kind, i) => ({
      kind,
      x: 0.16 + ((i * 0.169) % 0.68),
      y: 0.19 + ((i * 0.137) % 0.46),
      direction: i % 2 ? -1 : 1,
      seed: i + 1,
      speed:
        kind === "jelly" || kind === "seahorse" || kind === "horsea"
          ? 0.019
          : 0.025 + (i % 3) * 0.007,
      size:
        kind === "lapras"
          ? 1.3
          : kind === "turtle"
            ? 1.05
            : kind === "tetra" || kind === "lantern"
              ? 0.64
              : 0.85,
    })),
  };
}

// Food is capped both per tap and overall. It sinks, attracts the fish, and
// expires if uneaten, so repeated taps cannot create an ever-growing scene.
export function feedAquarium(scene, x = 0.5) {
  if (scene.food.length >= 24) return false;
  for (let i = 0; i < 6; i++) {
    scene.food.push({
      x: clamp(x + (i - 2.5) * 0.018, 0.16, 0.84),
      y: 0.06 + (i % 2) * 0.02,
      age: 0,
    });
  }
  return true;
}

export function updateAquarium(scene, seconds) {
  const dt = clamp(seconds, 0, 0.08);
  scene.time += dt;
  for (const food of scene.food) {
    food.y += dt * 0.025;
    food.age += dt;
  }
  scene.food = scene.food.filter((food) => food.age < 14 && food.y < 0.86);
  for (const creature of scene.creatures) {
    // The long-necked cove visitor eats with its head, leaving its body below
    // the surface instead of clipping the neck out of the top of the canvas.
    const mouthOffset = creature.kind === "lapras" ? 0.23 : 0;
    const edible = !["jelly", "seahorse", "horsea"].includes(creature.kind);
    const target =
      edible &&
      scene.food.reduce((best, food) => {
        const distance = Math.hypot(
          food.x - creature.x,
          food.y + mouthOffset - creature.y,
        );
        return !best || distance < best.distance ? { food, distance } : best;
      }, null);
    if (target) {
      const { food, distance } = target;
      if (distance > 0.015) {
        const step = Math.min(distance, dt * (creature.speed + 0.045));
        creature.x += ((food.x - creature.x) / distance) * step;
        creature.y += ((food.y + mouthOffset - creature.y) / distance) * step;
        if (Math.abs(food.x - creature.x) > 0.02)
          creature.direction = food.x > creature.x ? 1 : -1;
      } else {
        scene.food.splice(scene.food.indexOf(food), 1);
        scene.fed++;
      }
    } else {
      creature.x += dt * creature.speed * creature.direction;
      const homeY = 0.19 + (((creature.seed - 1) * 0.137) % 0.46);
      creature.y += (homeY - creature.y) * dt * 0.5;
      if (creature.x > 0.86) {
        creature.x = 0.86;
        creature.direction = -1;
      }
      if (creature.x < 0.14) {
        creature.x = 0.14;
        creature.direction = 1;
      }
    }
  }
}

function textGrid(columns, rows) {
  const glyphs = Array(columns * rows).fill(" ");
  const colors = Array(columns * rows).fill(null);
  function put(x, y, glyph, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= columns || y < 0 || y >= rows) return;
    const index = y * columns + x;
    glyphs[index] = glyph;
    colors[index] = color;
  }
  function line(x1, y1, x2, y2, color, glyph = ":") {
    const count = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)));
    for (let i = 0; i <= count; i++) {
      const t = count ? i / count : 0;
      put(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, glyph, color);
    }
  }
  // Analytic ellipses give bodies rounded volume. Character density and color
  // both follow a stable light direction instead of random per-frame noise.
  function oval(cx, cy, rx, ry, color, pattern) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const u = (x - cx) / rx,
          v = (y - cy) / ry;
        const radius = u * u + v * v;
        if (radius > 1) continue;
        const shade = clamp(
          0.5 + Math.sqrt(1 - radius) * 0.35 - v * 0.18 - u * 0.08,
          0.12,
          1,
        );
        const tone = pattern ? pattern(u, v, x, y, shade) : color;
        put(
          x,
          y,
          ".:=+*#@"[Math.floor(shade * 6)],
          mix([14, 28, 43], tone, shade),
        );
      }
    }
  }
  return { columns, rows, glyphs, colors, put, line, oval };
}

function landscape(grid, scene) {
  const { columns: w, rows: h, put, line, oval } = grid;
  const { style, time } = scene;
  // Slow, low-contrast rays and suspended specks stay behind the silhouettes.
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const n = (x * 37 + y * 61) % 131;
      const ray = Math.sin(x * 0.08 - y * 0.045 + time * 0.08);
      if (n < 3 || (ray > 0.97 && (x + y) % 4 === 0))
        put(
          x,
          y,
          n < 3 ? "." : ":",
          mix(style.water, style.accent, 0.13 + (1 - y / h) * 0.08),
        );
    }
  // Pebbles, substrate, and branches are composed in character cells. Plants
  // sway from fixed roots; their positions do not flicker or regenerate.
  for (let y = h - 5; y < h; y++)
    for (let x = 0; x < w; x++) {
      const n = ((x * 17 + y * 29) % 19) / 19;
      put(
        x,
        y,
        " .,:~*"[Math.floor(n * 6)],
        mix(style.water, style.bed, 0.3 + n * 0.5),
      );
    }
  [0.06, 0.19, 0.77, 0.91].forEach((p, i) => {
    oval(w * p, h - 5, 8 + (i % 3), 2.5, mix(style.bed, style.water, 0.35));
  });
  for (let plant = 0; plant < 15; plant++) {
    const base = ((plant * 0.173 + 0.035) % 1) * w;
    const height =
      h *
      (0.12 + ((plant * 7) % 11) * 0.023) *
      (style.landscape === "kelp" ? 1.55 : 1);
    const color = mix(style.plant, style.accent, (plant % 4) * 0.15);
    if (style.landscape === "coral" && plant % 3 === 0) {
      const top = h - 5 - height * 0.7;
      line(base, h - 5, base, top, color, "#");
      for (let branch = 0; branch < 5; branch++) {
        const y = top + branch * 1.6;
        const reach = (5 - branch * 0.4) * (branch % 2 ? 1 : -1);
        line(base, y + 3, base + reach, y, color, "+");
        put(base + reach, y - 1, "*", style.accent);
      }
    } else {
      for (let step = 0; step < height; step++) {
        const x =
          base + Math.sin(step * 0.23 + time * 0.6 + plant) * step * 0.13;
        const y = h - 5 - step;
        put(x, y, "|", color);
        if (step % 4 === 0 && step > 1) {
          const side = step % 8 ? 1 : -1;
          oval(x + side * 2.5, y - 1, 3.5, 1.2, color);
        }
        if (step % 3 === 0) {
          line(
            x,
            y,
            x + (step % 2 ? 3 : -3),
            y - 1.2,
            color,
            step % 2 ? "/" : "\\",
          );
        }
      }
    }
  }
  // Bubbles follow separate columns with staggered phases and sizes.
  for (let i = 0; i < 14; i++) {
    const phase = (time * 0.045 + i * 0.173) % 1;
    const x = ((i * 0.271 + 0.08) % 1) * w + Math.sin(time + i) * 1.5;
    put(
      x,
      (1 - phase) * (h - 4),
      i % 3 ? "o" : "O",
      mix(style.water, style.accent, 0.45),
    );
  }
}

function drawCreature(grid, c, time, index) {
  const scale = Math.min(grid.columns / 115, grid.rows / 55) * c.size * 1.6;
  const x = c.x * grid.columns;
  const y = c.y * grid.rows + Math.sin(time * 1.4 + index) * 0.6;
  const d = c.direction;
  const { put, oval, line } = grid;
  const at = (u, v, glyph, color) =>
    put(x + u * scale * d, y + v * scale, glyph, color);
  const body = (u, v, rx, ry, color, pattern) =>
    oval(
      x + u * scale * d,
      y + v * scale,
      rx * scale,
      ry * scale,
      color,
      pattern,
    );
  const stroke = (u1, v1, u2, v2, color, glyph) =>
    line(
      x + u1 * scale * d,
      y + v1 * scale,
      x + u2 * scale * d,
      y + v2 * scale,
      color,
      glyph,
    );
  const eye = (u, v) => {
    at(u, v, "o", [240, 251, 240]);
    at(u + 0.6, v, ".", [10, 21, 32]);
  };
  const beat = Math.sin(time * 4 + index);
  if (c.kind === "jelly") {
    const pink = index % 2 ? [207, 155, 242] : [124, 221, 227];
    for (let i = -3; i <= 3; i++) {
      for (let j = 2; j < 11; j++)
        at(
          i * 1.5 + Math.sin(time * 2 + j * 0.4 + i) * (j / 7),
          j,
          j % 3 ? ":" : "~",
          mix([38, 48, 91], pink, 1 - j / 16),
        );
    }
    body(0, -0.7, 6 + beat * 0.5, 3 + beat * 0.4, pink);
    stroke(-5, 1, 5, 1, pink, "~");
    return;
  }
  if (c.kind === "turtle") {
    const green = [127, 199, 147];
    body(-2, -3, 3, 1 + beat * 0.25, green);
    body(-2, 3, 3, 1 - beat * 0.25, green);
    body(1, -3, 2, 1, green);
    body(1, 3, 2, 1, green);
    body(-1, 0, 5, 3, [114, 160, 101], (u, v) =>
      Math.cos(u * 10) * Math.cos(v * 8) > 0.1
        ? [149, 187, 108]
        : [83, 127, 89],
    );
    body(5, 0, 2.5, 1.5, green);
    eye(6, -0.4);
    at(-7, 0, "<", green);
    return;
  }
  if (c.kind === "seahorse" || c.kind === "horsea") {
    const color = c.kind === "horsea" ? BLUE : GOLD;
    stroke(-3, 0, -5, 2 + beat, color, ":");
    body(-1, 1, 3, 4, color);
    body(0, -4, 3, 2.5, color);
    stroke(2, -4, 5, -4, color, "=");
    eye(1, -5);
    for (let j = 0; j < 22; j++) {
      const a = (j / 22) * Math.PI * 2.2;
      at(-1 + Math.cos(a) * (2 - j / 18), 6 + Math.sin(a) * 1.3, ":", color);
    }
    for (let j = 0; j < 4; j++)
      at(-3, -3 + j * 2, "<", mix(color, [241, 224, 167], 0.35));
    return;
  }
  if (c.kind === "lapras") {
    body(-1, 2, 7, 3.5, BLUE);
    body(-2, 0, 5.5, 2.7, [154, 174, 198], (u, v) =>
      Math.sin(u * 14) > 0.5 && v < 0 ? [224, 227, 229] : [131, 158, 184],
    );
    body(4, -1, 2, 5, BLUE);
    body(5, -5, 3, 2, BLUE);
    body(-4, 5, 4, 1.2 + beat * 0.3, BLUE);
    body(3, 5, 3, 1.2 - beat * 0.3, BLUE);
    at(3, -7, "^", BLUE);
    at(6, -7, "^", BLUE);
    eye(6, -5);
    return;
  }
  const color = ["clownfish", "magikarp", "goldfish"].includes(c.kind)
    ? GOLD
    : c.kind === "angelfish"
      ? [218, 211, 165]
      : c.kind === "tang"
        ? BLUE
        : c.kind === "lantern"
          ? [122, 228, 208]
          : SILVER;
  // Tail strokes open and close while the body remains intact. This avoids a
  // duplicated or mirrored body when fish change direction at a tank edge.
  for (let j = -3; j <= 3; j++)
    stroke(
      -5,
      0,
      -9 + Math.abs(beat),
      j * (0.8 + beat * 0.12),
      mix(color, CORAL, 0.2),
      ":",
    );
  if (["angelfish", "magikarp"].includes(c.kind)) {
    for (let j = -3; j < 3; j++)
      stroke(j, -2, j - 1, -5 + Math.abs(j), color, "^");
    stroke(0, 2, -2, 5, color, "v");
  }
  body(0, 0, 6, c.kind === "angelfish" ? 4 : 2.6, color, (u, v) => {
    if (c.kind === "clownfish" && Math.cos((u + 0.1) * 9) > 0.55)
      return [238, 238, 221];
    if (c.kind === "angelfish" && Math.sin(u * 11) > 0.55)
      return [73, 105, 121];
    if (c.kind === "tetra") return v < 0 ? [68, 200, 229] : [243, 106, 127];
    return color;
  });
  stroke(-1, 0.5, -2, 2.8 + beat * 0.3, mix(color, [255, 230, 178], 0.5), "/");
  eye(3.5, -0.8);
  at(6, 0.5, ">", color);
  if (c.kind === "magikarp") {
    stroke(5, 1, 8, 3, GOLD, "~");
    stroke(4, -1, 7, -3, GOLD, "~");
  }
  if (c.kind === "lantern") {
    stroke(3, -2, 4, -4, BLUE, ":");
    at(5, -4, "*", [218, 255, 184]);
  }
}

export function renderAquarium(context, scene, width, height) {
  // A fixed logical composition makes the full habitat fit at every size.
  // It is redrawn at up to 30 fps without any per-frame React state updates.
  const rows = 52;
  const columns = clamp(Math.round((width / height) * rows * 1.55), 82, 180);
  const grid = textGrid(columns, rows);
  landscape(grid, scene);
  scene.creatures.forEach((c, i) => drawCreature(grid, c, scene.time, i));
  scene.food.forEach((food) =>
    grid.put(food.x * columns, food.y * rows, "*", [252, 214, 137]),
  );
  context.fillStyle = rgb(scene.style.water);
  context.fillRect(0, 0, width, height);
  const cell = Math.min(width / columns, height / (rows * 1.55));
  const cellHeight = cell * 1.55;
  const ox = Math.max(0, (width - cell * columns) / 2),
    oy = Math.max(0, (height - cellHeight * rows) / 2);
  context.font = `bold ${cellHeight}px "Courier New", monospace`;
  context.textBaseline = "top";
  for (let i = 0; i < grid.glyphs.length; i++) {
    if (grid.glyphs[i] === " ") continue;
    context.fillStyle = rgb(grid.colors[i]);
    context.fillText(
      grid.glyphs[i],
      ox + (i % columns) * cell,
      oy + Math.floor(i / columns) * cellHeight,
    );
  }
  return grid;
}
