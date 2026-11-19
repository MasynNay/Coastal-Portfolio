// Browser adaptation of Alish Sharma's MIT-licensed bouquet3d.py.
// Source: https://github.com/alishsharma17/Ascii-Flower-Bouquet-
// Copyright (c) 2026 Alish Sharma. Full license: /licenses/AsciiBouquet.txt.
// The scene is a point cloud, projected into character cells with a depth buffer.
// Keeping the renderer independent of React avoids rerendering the Mac desktop.

const TAU = Math.PI * 2;
const GREENS = [22, 28, 28, 34, 35, 71, 77, 114];
const PAPER = [101, 144, 187, 223, 230, 231];
const RIBBON = [88, 125, 161, 197, 204, 211];
const PINK = [125, 162, 168, 205, 211, 218, 225];
const RED = [52, 88, 124, 160, 196, 203];
const YELLOW = [136, 178, 214, 220, 226, 229];
const GOLD = [94, 136, 178, 214, 220];
const DARK = [52, 58, 94, 130, 136];
const FLOWERS = [
  [[244, 248, 251, 254, 255, 231], GOLD, 13],
  [PINK, GOLD, 8],
  [RED, DARK, 6],
  [[54, 91, 97, 134, 140, 183], GOLD, 7],
  [YELLOW, DARK, 12],
  [[130, 166, 202, 208, 214, 216], DARK, 9],
];
const HEARTS = [161, 197, 204, 205, 211, 218];
const SHADE = ".:-=+*%@";
const PETAL_SHADE = "+*#%";

function normalize([x, y, z]) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function clamp(value) {
  return Math.max(0, Math.min(0.999, value));
}

// Seeded variation is stable between frames and visits, so leaves and petals
// never jump around when the animation pauses, resumes, or changes size.
function randomSource(seed = 21) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function createBouquet() {
  const random = randomSource();
  const range = (low, high) => low + random() * (high - low);
  const points = [];
  const flowers = [];
  const babies = [];
  const sparkles = [];
  const hearts = [];
  const point = (position, normal, palette, tone = 0, twoSided = true, glyph) =>
    points.push({ position, normal, palette, tone, twoSided, glyph });
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  let discIndex = 0;

  // A spiral dome gives the flower heads depth as the bouquet rotates.
  for (let index = 0; index < 10; index += 1) {
    const elevation = ((88 - 60 * Math.sqrt(index / 9)) * Math.PI) / 180;
    const angle = index * goldenAngle;
    const axis = [
      Math.cos(elevation) * Math.cos(angle),
      Math.sin(elevation),
      Math.cos(elevation) * Math.sin(angle),
    ];
    const distance = 0.64 * range(0.92, 1.05);
    const position = [
      axis[0] * distance,
      0.12 + axis[1] * distance,
      axis[2] * distance,
    ];
    const base = position.map((value, i) => value - axis[i] * 0.03);
    for (let step = 0; step < 70; step += 1) {
      const t = step / 69;
      point(
        [base[0] * (1 - t), base[1] * (1 - t) - 0.12 * t, base[2] * (1 - t)],
        [axis[0], 0, axis[2]],
        GREENS,
        -0.15,
      );
    }
    const tulip = index === 3 || index === 8;
    const [palette, center, petals] = FLOWERS[discIndex % FLOWERS.length];
    flowers.push({
      position,
      tulip,
      palette: tulip ? (index === 3 ? RED : PINK) : palette,
      center,
      petals,
      radius: tulip ? 0.11 : range(0.12, 0.14),
      phase: random() * TAU,
    });
    if (!tulip) discIndex += 1;
  }

  // Curled leaves and their darker center ribs sit between the stems and wrap.
  for (let index = 0; index < 8; index += 1) {
    const angle = ((index + 0.4) / 8) * TAU;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const base = [0.26 * cosine, 0.3, 0.26 * sine];
    const direction = normalize([cosine, 0.15, sine]);
    const side = [-sine, 0, cosine];
    const normal = normalize(cross(side, direction));
    for (let step = 0; step < 32; step += 1) {
      const t = step / 31;
      for (let across = -5; across <= 5; across += 1) {
        const width = across / 5;
        const position = base.map(
          (value, i) =>
            value +
            direction[i] * 0.3 * t +
            side[i] * 0.07 * Math.sin(Math.PI * t) * width +
            normal[i] * 0.025 * width * width,
        );
        position[1] -= 0.1 * t * t;
        point(position, normal, GREENS, across === 0 ? -0.25 : 0);
      }
    }
  }

  // The paper is a shaded cone with folded, gently scalloped edges.
  const slope = (0.36 - 0.06) / 0.5;
  for (let ring = 0; ring < 50; ring += 1) {
    const t = ring / 49;
    const radius = 0.06 + 0.3 * t;
    const count = Math.max(8, Math.floor(170 * radius));
    for (let index = 0; index < count; index += 1) {
      const angle = ((index + random()) / count) * TAU;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      point(
        [
          radius * cosine,
          -0.2 + 0.5 * t + (t > 0.9 ? 0.03 * Math.sin(9 * angle) : 0),
          radius * sine,
        ],
        normalize([cosine, -slope, sine]),
        PAPER,
        0.3 * (Math.abs(Math.sin(5 * angle)) - 0.6),
        false,
      );
    }
  }
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * TAU;
    for (let step = 0; step < 40; step += 1) {
      const t = step / 39;
      point(
        [
          0.025 * Math.cos(angle) * (1 + 1.2 * t),
          -0.2 - 0.3 * t,
          0.025 * Math.sin(angle) * (1 + 1.2 * t),
        ],
        [Math.cos(angle), 0, Math.sin(angle)],
        GREENS,
        -0.1,
      );
    }
  }

  // A ribbon encircles the neck, with two loops and hanging tails.
  const ribbonY = -0.12;
  const ribbonRadius = 0.06 + slope * (ribbonY + 0.2) + 0.01;
  const knotZ = ribbonRadius + 0.01;
  for (let index = 0; index < 90; index += 1) {
    const angle = (index / 90) * TAU;
    for (const offset of [-0.012, 0, 0.012]) {
      point(
        [
          ribbonRadius * Math.cos(angle),
          ribbonY + offset,
          ribbonRadius * Math.sin(angle),
        ],
        [Math.cos(angle), 0, Math.sin(angle)],
        RIBBON,
        0,
        false,
      );
    }
  }
  for (const side of [-1, 1]) {
    for (let index = 0; index < 70; index += 1) {
      const angle = (index / 70) * TAU;
      const loopX = side * (0.07 + 0.07 * Math.cos(angle));
      const loopY =
        0.04 * Math.sin(angle) +
        (0.02 * (0.07 + 0.07 * Math.cos(angle))) / 0.14;
      for (const fill of [1, 0.7]) {
        point(
          [loopX * fill, ribbonY + loopY * fill, knotZ + 0.01],
          [side * 0.3, 0.2, 0.93],
          RIBBON,
          0.1,
        );
      }
    }
    for (let step = 0; step < 30; step += 1) {
      const t = step / 29;
      point(
        [side * 0.06 * t, ribbonY - 0.15 * t, knotZ + 0.015],
        [side * 0.2, 0, 0.98],
        RIBBON,
        -0.05 + 0.05 * Math.sin(t * 9),
      );
    }
  }
  for (const x of [-0.01, 0, 0.01]) {
    point([x, ribbonY, knotZ + 0.02], [0, 0, 1], RIBBON, 0.2, true, "@");
  }

  for (let index = 0; index < 90; index += 1) {
    const angle = random() * TAU;
    const elevation = range(0.3, 1.4);
    const radius = range(0.4, 0.58);
    babies.push({
      position: [
        radius * Math.cos(angle) * Math.cos(elevation),
        0.12 + radius * Math.sin(elevation),
        radius * Math.sin(angle) * Math.cos(elevation),
      ],
      phase: random() * TAU,
    });
  }
  for (let index = 0; index < 30; index += 1) {
    const angle = random() * TAU;
    const radius = range(0.75, 0.95);
    sparkles.push({
      position: [
        radius * Math.cos(angle),
        range(-0.3, 1),
        radius * Math.sin(angle),
      ],
      phase: random() * TAU,
      speed: range(1.5, 4),
    });
  }
  for (let index = 0; index < 18; index += 1) {
    hearts.push({
      x: random(),
      y: random(),
      speed: range(0.03, 0.08),
      phase: random() * TAU,
      color: HEARTS[Math.floor(random() * HEARTS.length)],
    });
  }
  return { points, flowers, babies, sparkles, hearts };
}

// Convert the original terminal's 256-color palette to browser CSS colors.
export function terminalColor(index) {
  if (index >= 232) {
    const level = 8 + (index - 232) * 10;
    return `rgb(${level}, ${level}, ${level})`;
  }
  const levels = [0, 95, 135, 175, 215, 255];
  const value = index - 16;
  return `rgb(${levels[Math.floor(value / 36)]}, ${levels[Math.floor(value / 6) % 6]}, ${levels[value % 6]})`;
}

const COLORS = Array.from({ length: 240 }, (_, index) =>
  terminalColor(index + 16),
);
const LIGHT = normalize([-0.45, 0.6, 0.66]);

export function createFrame(columns, rows) {
  return {
    columns,
    rows,
    characters: new Array(columns * rows).fill(" "),
    colors: new Uint8Array(columns * rows),
    depth: new Float32Array(columns * rows),
  };
}

export function renderBouquet(
  context,
  scene,
  frame,
  time,
  cellWidth,
  cellHeight,
) {
  const { columns, rows, characters, colors, depth } = frame;
  characters.fill(" ");
  depth.fill(-Infinity);
  const scale = Math.max(1, Math.min((rows - 2) / 1.45, (columns - 2) / 2.7));
  const centerX = columns / 2;
  const centerY = 1 + 0.78 * scale;
  const angle = time * 0.6;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const tiltCosine = Math.cos(0.3);
  const tiltSine = Math.sin(0.3);

  function project([x, y, z]) {
    const rotatedX = x * cosine - z * sine;
    const rotatedZ = x * sine + z * cosine;
    const tiltedY = (y - 0.2) * tiltCosine - rotatedZ * tiltSine;
    const tiltedZ = (y - 0.2) * tiltSine + rotatedZ * tiltCosine;
    const perspective = 4 / (4 - tiltedZ);
    return [
      centerX + rotatedX * perspective * scale * 2,
      centerY - tiltedY * perspective * scale,
      tiltedZ,
      perspective,
    ];
  }

  function plot(x, y, z, glyph, color) {
    const column = Math.floor(x);
    const row = Math.floor(y);
    if (column < 0 || column >= columns || row < 0 || row >= rows) return;
    const index = row * columns + column;
    if (z <= depth[index]) return;
    depth[index] = z;
    characters[index] = glyph;
    colors[index] = color;
  }

  for (const heart of scene.hearts) {
    const x = (heart.x + 0.015 * Math.sin(time * 1.2 + heart.phase) + 1) % 1;
    const y = (((heart.y - time * heart.speed) % 1) + 1) % 1;
    plot(x * columns, y * rows, -50, "♥", heart.color);
  }
  for (const point of scene.points) {
    const [x, y, z] = project(point.position);
    const [nx, ny, nz] = point.normal;
    const rotatedX = nx * cosine - nz * sine;
    const rotatedZ = nx * sine + nz * cosine;
    const tiltedY = ny * tiltCosine - rotatedZ * tiltSine;
    const tiltedZ = ny * tiltSine + rotatedZ * tiltCosine;
    let light = rotatedX * LIGHT[0] + tiltedY * LIGHT[1] + tiltedZ * LIGHT[2];
    if (point.twoSided && light < 0) light = -light * 0.55;
    const brightness = clamp(0.25 + 0.75 * Math.max(0, light) + point.tone);
    plot(
      x,
      y,
      z,
      point.glyph || SHADE[Math.floor(brightness * SHADE.length)],
      point.palette[Math.floor(brightness * point.palette.length)],
    );
  }

  // Billboarded heads keep the original petal silhouettes legible at every
  // angle. Their centers still move through real perspective and occlusion.
  for (const flower of scene.flowers) {
    const [x, y, z, perspective] = project(flower.position);
    const radiusY = flower.radius * perspective * scale;
    const radiusX = radiusY * 2;
    const dim = -0.4 * (1 - Math.min(1, Math.max(0, (z + 0.6) / 1.2)));
    const rotation = flower.phase + angle * 0.7;
    for (
      let row = Math.floor(y - radiusY) - 1;
      row <= Math.ceil(y + radiusY);
      row += 1
    ) {
      const dy = (row + 0.5 - y) / radiusY;
      for (
        let column = Math.floor(x - radiusX) - 1;
        column <= Math.ceil(x + radiusX);
        column += 1
      ) {
        const dx = (column + 0.5 - x) / radiusX;
        if (flower.tulip) {
          const v = (1 - dy) / 2;
          if (v < 0 || v > 1) continue;
          const halfWidth =
            0.62 * Math.sin(Math.PI * 0.5 * Math.min(1, v * 1.5 + 0.05));
          if (halfWidth <= 0 || Math.abs(dx) > halfWidth) continue;
          const across = dx / halfWidth;
          if (v > 0.72 + 0.28 * Math.cos(1.5 * Math.PI * across) ** 2) continue;
          const seam =
            Math.abs(Math.abs(across) - 0.33) < 0.12 && v > 0.3 ? -0.25 : 0;
          const brightness = clamp(0.55 - 0.3 * across + 0.1 * v + seam + dim);
          plot(
            column,
            row,
            z + 0.03,
            PETAL_SHADE[Math.floor(brightness * 4)],
            flower.palette[Math.floor(brightness * flower.palette.length)],
          );
          continue;
        }
        const distance = Math.hypot(dx, dy);
        if (distance > 1) continue;
        if (distance < 0.3) {
          const brightness = clamp(0.55 - 0.35 * dx - 0.35 * dy + dim);
          plot(
            column,
            row,
            z + 0.06,
            distance < 0.17 ? "@" : "o",
            flower.center[Math.floor(brightness * flower.center.length)],
          );
          continue;
        }
        const reach =
          0.32 +
          0.68 *
            Math.abs(
              Math.cos((flower.petals * (Math.atan2(dy, dx) + rotation)) / 2),
            ) **
              0.7;
        if (distance > reach) continue;
        const edge = distance > reach - 0.14 ? -0.22 : 0;
        const brightness = clamp(
          0.62 - 0.22 * dx - 0.28 * dy + 0.12 * distance + edge + dim,
        );
        plot(
          column,
          row,
          z + 0.04 * (1 - distance),
          PETAL_SHADE[Math.floor(brightness * 4)],
          flower.palette[Math.floor(brightness * flower.palette.length)],
        );
      }
    }
  }
  for (const baby of scene.babies) {
    const [x, y, z] = project(baby.position);
    const bright = Math.sin(time * 2 + baby.phase) > 0.6;
    plot(x, y, z + 0.02, bright ? "*" : "·", bright ? 231 : 255);
  }
  for (const sparkle of scene.sparkles) {
    const [x, y, z] = project(sparkle.position);
    const brightness = Math.sin(time * sparkle.speed + sparkle.phase);
    if (brightness > 0) {
      plot(
        x,
        y,
        z,
        brightness > 0.85 ? "*" : brightness > 0.4 ? "+" : "·",
        brightness > 0.85 ? 231 : brightness > 0.4 ? 225 : 218,
      );
    }
  }

  context.clearRect(0, 0, columns * cellWidth, rows * cellHeight);
  // Adjacent characters of the same color become one canvas draw call.
  for (let row = 0; row < rows; row += 1) {
    let column = 0;
    while (column < columns) {
      const start = column;
      const color = colors[row * columns + column];
      let text = characters[row * columns + column];
      column += 1;
      while (column < columns && colors[row * columns + column] === color) {
        text += characters[row * columns + column];
        column += 1;
      }
      if (text.trim()) {
        context.fillStyle = COLORS[color - 16];
        context.fillText(text, start * cellWidth, row * cellHeight);
      }
    }
  }
}
