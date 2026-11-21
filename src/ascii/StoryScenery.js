// Object-led storybook scenes: each composition has a recognizable landmark,
// creature or vehicle. All primitives still place colored terminal characters.
export function drawStoryScenery(grid, scene) {
  const { form, plant, accent, bed } = scene.style;
  if (!form) return false;
  const { columns: w, rows: h, put, line, oval, polygon } = grid,
    t = scene.time;
  const box = (x, y, a, b, c) =>
    polygon(
      [
        [x, y],
        [x + a, y],
        [x + a, y + b],
        [x, y + b],
      ],
      c,
    );
  const roof = (x, y, a, c) =>
    polygon(
      [
        [x - a, y + 4],
        [x, y],
        [x + a, y + 4],
      ],
      c,
    );
  const window = (x, y) => {
    oval(x, y, 2, 1.5, accent);
    put(x, y, "+", bed);
  };
  for (let i = 0; i < 75; i++)
    put(
      (((i * 31) % 181) / 181) * w,
      (((i * 17) % 73) / 73) * h,
      Math.sin(t * 0.7 + i) > 0.8 ? "*" : ".",
      [68, 92, 119],
    );
  if (form === "moving-castle") {
    const bob = Math.sin(t * 2) * 0.5,
      x = w * 0.5,
      y = h * 0.65 + bob;
    for (const side of [-1, 1]) {
      const step = Math.sin(t * 2 + side) * 2;
      line(x + side * 10, y + 3, x + side * 15 + step, y + 11, bed, "#");
      line(x + side * 15 + step, y + 11, x + side * 21, y + 12, bed, "=");
    }
    oval(x, y - 3, 17, 9, bed);
    box(x - 12, y - 22, 10, 17, plant);
    roof(x - 7, y - 27, 8, accent);
    box(x + 3, y - 27, 9, 20, bed);
    roof(x + 7, y - 32, 7, plant);
    box(x - 1, y - 32, 3, 14, bed);
    for (const [dx, dy] of [
      [-8, -17],
      [7, -20],
      [-5, -5],
      [7, -6],
    ])
      window(x + dx, y + dy);
    line(x - 14, y, x - 24, y - 3, bed, "#");
    oval(x - 24, y - 3, 4, 2, accent);
    for (let i = 0; i < 6; i++)
      oval(
        x + Math.sin(i + t) * 2,
        y - 33 - ((i * 3 + t * 2) % 10),
        3,
        1.5,
        [128, 142, 148],
      );
  } else if (form === "delivery-cat") {
    // Jiji's pointed ears and eyes, with a broom silhouette passing overhead.
    const x = w * 0.5,
      y = h * 0.67;
    oval(x, y, 8, 8, [102, 98, 129]);
    oval(x, y - 10, 8, 5, [102, 98, 129]);
    polygon(
      [
        [x - 7, y - 12],
        [x - 8, y - 20],
        [x - 1, y - 13],
      ],
      [102, 98, 129],
    );
    polygon(
      [
        [x + 1, y - 13],
        [x + 8, y - 20],
        [x + 7, y - 12],
      ],
      [102, 98, 129],
    );
    oval(x - 3, y - 10, 1.5, 1.8, accent);
    oval(x + 3, y - 10, 1.5, 1.8, accent);
    put(x, y - 7, "v", accent);
    for (let i = 0; i < 25; i++) {
      const a = i * 0.12;
      put(
        x + 9 + Math.sin(a) * 8,
        y + 4 - Math.cos(a) * 7,
        "#",
        [102, 98, 129],
      );
    }
    const bx = ((t * 5) % (w + 25)) - 12;
    line(bx, h * 0.21, bx + 16, h * 0.18, bed, "/");
    for (let i = 0; i < 5; i++)
      line(bx, h * 0.21, bx - 5, h * 0.18 + i, accent, "/");
  } else if (form === "ponyo-shore") {
    for (let y = h * 0.6; y < h * 0.9; y += 3)
      for (let x = 0; x < w; x++)
        if (Math.sin(x * 0.13 + t + y) > 0.3) put(x, y, "~", plant);
    const x = w * 0.5,
      y = h * 0.48 + Math.sin(t) * 2;
    oval(x, y, 12, 7, [224, 103, 91]);
    oval(x, y - 4, 9, 5, [247, 158, 113]);
    oval(x, y - 3, 7, 3, [255, 222, 179]);
    put(x - 3, y - 4, "o", [57, 74, 91]);
    put(x + 3, y - 4, "o", [57, 74, 91]);
    line(x - 2, y - 1, x + 2, y - 1, [160, 96, 103], "-");
    polygon(
      [
        [x - 9, y + 3],
        [x - 18, y + 6],
        [x - 10, y + 8],
      ],
      [235, 139, 114],
    );
    polygon(
      [
        [x + 9, y + 3],
        [x + 18, y + 6],
        [x + 10, y + 8],
      ],
      [235, 139, 114],
    );
  } else if (form === "catbus") {
    const x = w * 0.5,
      y = h * 0.6;
    oval(x, y, 24, 8, bed);
    box(x - 17, y - 9, 31, 12, plant);
    for (let i = 0; i < 5; i++) box(x - 15 + i * 6, y - 7, 4, 5, accent);
    oval(x + 20, y - 1, 10, 7, bed);
    polygon(
      [
        [x + 13, y - 6],
        [x + 15, y - 15],
        [x + 20, y - 7],
      ],
      bed,
    );
    polygon(
      [
        [x + 23, y - 7],
        [x + 29, y - 14],
        [x + 28, y - 4],
      ],
      bed,
    );
    oval(x + 20, y - 3, 1.5, 1.3, accent);
    oval(x + 27, y - 3, 1.5, 1.3, accent);
    line(x + 18, y + 2, x + 28, y + 2, accent, "=");
    for (let i = 0; i < 8; i++) {
      const px = x - 21 + i * 6;
      line(px, y + 6, px + Math.sin(t * 4 + i) * 2, y + 12, bed, "#");
    }
    box(x - 5, y - 13, 12, 3, accent);
    line(x - 2, y - 12, x + 4, y - 12, bed, "-");
  } else if (form === "spirit-train") {
    for (let y = h * 0.63; y < h * 0.91; y += 3)
      line(0, y, w, y, [73, 116, 141], "~");
    const x = w * 0.5 + Math.sin(t * 0.2) * 5,
      y = h * 0.51;
    for (let i = -1; i <= 1; i++) {
      box(x + i * 29 - 13, y - 9, 26, 12, bed);
      for (let j = 0; j < 4; j++)
        box(x + i * 29 - 10 + j * 6, y - 7, 4, 4, accent);
      line(x + i * 29 - 13, y + 1, x + i * 29 + 13, y + 1, plant, "=");
    }
    for (let i = 0; i < 30; i++)
      put((i * w) / 30, h * 0.73 + Math.sin(t * 2 + i) * 0.5, ":", accent);
  } else if (form === "soot-workshop") {
    for (let i = 0; i < 8; i++) {
      const x = w * (0.14 + (i % 4) * 0.24),
        y =
          h * (0.4 + Math.floor(i / 4) * 0.3) -
          Math.abs(Math.sin(t * 2 + i)) * 2;
      for (let j = 0; j < 12; j++) {
        const a = (j * Math.PI) / 6;
        line(x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 4, bed, "*");
      }
      oval(x, y, 5, 3, bed);
      oval(x - 2, y, 1.5, 1.3, [243, 242, 220]);
      oval(x + 2, y, 1.5, 1.3, [243, 242, 220]);
      put(x - 2, y, ".", [42, 49, 65]);
      put(x + 2, y, ".", [42, 49, 65]);
      put(x + 6, y - 5, "*", i % 2 ? [234, 155, 193] : accent);
    }
  } else if (form === "earth-garden") {
    box(w * 0.12, h * 0.83, w * 0.76, 3, bed);
    for (let i = 0; i < 5; i++) {
      const x = w * (0.2 + i * 0.15),
        y = h * (0.56 - (i % 2) * 0.12) + Math.sin(t + i);
      polygon(
        [
          [x - 4, y],
          [x - 3, y - 5],
          [x + 3, y - 6],
          [x + 5, y],
          [x + 2, y + 3],
          [x - 2, y + 3],
        ],
        plant,
      );
    }
    for (let i = 0; i < 3; i++)
      line(
        w * 0.25,
        h * (0.31 + i * 0.06),
        w * 0.75,
        h * (0.31 + i * 0.06),
        accent,
        ":",
      );
  } else if (form === "water-tribe") {
    oval(w * 0.75, h * 0.2, 6, 4, accent);
    for (const [x, y, r] of [
      [w * 0.24, h * 0.72, 12],
      [w * 0.7, h * 0.7, 15],
    ]) {
      oval(x, y, r, 7, plant);
      box(x - 3, y - 1, 6, 7, bed);
      for (let i = 0; i < 3; i++)
        line(
          x - r * 0.8,
          y - 4 + i * 3,
          x + r * 0.8,
          y - 4 + i * 3,
          accent,
          ":",
        );
    }
    for (let y = h * 0.85; y < h * 0.96; y += 2)
      for (let x = 0; x < w; x++)
        if (Math.sin(x * 0.2 + t + y) > 0.4) put(x, y, "~", accent);
  } else if (form === "fire-lanterns") {
    for (let i = 0; i < 3; i++) {
      const x = w * (0.25 + i * 0.25);
      box(x - 7, h * 0.45, 14, h * 0.34, bed);
      roof(x, h * 0.35, 11, plant);
      window(x, h * 0.57);
    }
    for (let i = 0; i < 9; i++) {
      const x = w * (0.07 + i * 0.11),
        y = h * (0.12 + (i % 3) * 0.07) + Math.sin(t + i);
      oval(x, y, 2, 2, accent);
      put(x, y, "|", plant);
    }
  } else if (form === "sky-bison") {
    const x = w * 0.5,
      y = h * 0.5 + Math.sin(t) * 1.2;
    oval(x, y, 23, 10, [217, 220, 196]);
    oval(x + 21, y, 10, 8, [201, 204, 181]);
    for (const side of [-1, 1])
      polygon(
        [
          [x + 18 + side * 6, y - 5],
          [x + 18 + side * 9, y - 13],
          [x + 18 + side * 3, y - 6],
        ],
        bed,
      );
    for (let i = 0; i < 6; i++)
      oval(x - 16 + i * 7, y + 9 + Math.sin(t * 2 + i) * 0.6, 3, 4, bed);
    line(x - 15, y - 7, x + 15, y - 7, bed, "=");
    polygon(
      [
        [x + 21, y - 6],
        [x + 18, y - 2],
        [x + 24, y - 2],
      ],
      bed,
    );
    put(x + 24, y, "o", [62, 74, 85]);
    for (let i = 0; i < 4; i++)
      oval(
        ((i * 0.29 + t * 0.013) % 1) * w,
        h * (0.2 + i * 0.2),
        13,
        2,
        [99, 143, 164],
      );
  } else if (form === "rivendell") {
    for (const x of [w * 0.15, w * 0.35, w * 0.65, w * 0.85]) {
      box(x - 2, h * 0.25, 4, h * 0.48, plant);
      roof(x, h * 0.15, 6, accent);
    }
    for (let x = w * 0.15; x < w * 0.85; x++)
      put(
        x,
        h * 0.73 - Math.sin(((x / w - 0.15) / 0.7) * Math.PI) * 8,
        "=",
        accent,
      );
    for (let y = h * 0.28; y < h * 0.87; y++)
      line(
        w * 0.47,
        y,
        w * 0.53,
        y,
        Math.floor(y + t * 4) % 3 ? plant : accent,
        "|",
      );
  } else if (form === "moria") {
    for (const x of [w * 0.18, w * 0.82]) {
      line(x, h * 0.77, x, h * 0.21, plant, "#");
      oval(x, h * 0.19, 4, 2, accent);
    }
    for (let i = 0; i < 38; i++) {
      const a = Math.PI + (i / 37) * Math.PI;
      put(
        w * 0.5 + Math.cos(a) * w * 0.32,
        h * 0.38 + Math.sin(a) * h * 0.25,
        "*",
        accent,
      );
    }
    line(w * 0.5, h * 0.25, w * 0.5, h * 0.72, plant, "|");
    for (let i = 0; i < 3; i++)
      line(w * 0.5, h * 0.52, w * (0.35 + i * 0.15), h * 0.37, accent, "/");
    for (let x = w * 0.1; x < w * 0.9; x++) put(x, h * 0.86, "=", plant);
  } else if (form === "ent-garden") {
    const x = w * 0.5,
      y = h * 0.75;
    box(x - 6, y - 21, 12, 24, bed);
    for (let i = -2; i <= 2; i++) {
      line(x + i, y - 11, x + i * 8, y - 26, bed, "#");
      oval(x + i * 8, y - 28, 10, 5, plant);
    }
    oval(x - 3, y - 13, 1, 1, accent);
    oval(x + 3, y - 13, 1, 1, accent);
    line(x - 3, y - 7, x + 3, y - 7, accent, "_");
    for (let i = 0; i < 5; i++)
      line(x, y + 1, x + (i - 2) * 7 + Math.sin(t * 0.7 + i), y + 7, bed, "#");
  } else if (form === "lonely-mountain") {
    polygon(
      [
        [w * 0.1, h * 0.85],
        [w * 0.5, h * 0.14],
        [w * 0.9, h * 0.85],
      ],
      bed,
    );
    polygon(
      [
        [w * 0.43, h * 0.27],
        [w * 0.5, h * 0.14],
        [w * 0.58, h * 0.29],
      ],
      accent,
    );
    oval(w * 0.5, h * 0.74, 7, 5, plant);
    const x = w * (0.5 + Math.sin(t * 0.3) * 0.22),
      y = h * (0.29 + Math.cos(t * 0.3) * 0.06);
    line(x - 8, y, x + 7, y, accent, "=");
    polygon(
      [
        [x, y],
        [x - 6, y - 6 - Math.sin(t * 4) * 2],
        [x - 2, y + 1],
      ],
      plant,
    );
    polygon(
      [
        [x, y],
        [x + 5, y - 6 + Math.sin(t * 4) * 2],
        [x + 2, y + 1],
      ],
      plant,
    );
    put(x + 8, y, ">", accent);
  }
  return true;
}
