// Slow, deterministic landscape studies. Form selects actual geometry, while
// each scene's palette and atmosphere describe its own place and time of day.
export function drawNatureLandscape(grid, scene) {
  const { form, plant, accent, bed } = scene.style;
  if (!form || scene.style.category !== "nature") return false;
  const { columns: w, rows: h, put, line, oval, polygon } = grid,
    t = scene.time;
  const colors = { distant: [53, 83, 108], middle: bed, near: plant };
  const ridge = (base, amplitude, color, seed) => {
    const points = [[0, h]];
    for (let x = 0; x <= w; x++)
      points.push([
        x,
        h * base +
          Math.sin(x * 0.055 + seed) * amplitude +
          Math.sin(x * 0.13 + seed) * amplitude * 0.35,
      ]);
    points.push([w, h]);
    polygon(points, color);
  };
  const pine = (x, y, size, color) => {
    line(x, y, x, y - size, color, "|");
    for (let i = 0; i < 4; i++)
      polygon(
        [
          [x, y - size + i * size * 0.18],
          [x - size * (0.17 + i * 0.07), y - size + (i + 1) * size * 0.22],
          [x + size * (0.17 + i * 0.07), y - size + (i + 1) * size * 0.22],
        ],
        color,
      );
  };
  const water = (base) => {
    for (let y = Math.floor(h * base); y < h - 2; y++)
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(x * 0.16 + y * 0.7 + t * 0.65);
        if (wave > 0.7) put(x, y, "~", [101, 171, 192]);
        else if ((x + y * 3) % 13 === 0) put(x, y, ".", bed);
      }
  };
  const tree = (x, y, size, color, flowers = false) => {
    line(x, y, x, y - size * 0.6, bed, "#");
    for (let i = -2; i <= 2; i++) {
      const branch = x + i * size * 0.2;
      line(x, y - size * 0.35, branch, y - size * 0.64, bed, "/");
      oval(
        branch,
        y - size * 0.65 - Math.abs(i) * 0.5,
        size * 0.29,
        size * 0.19,
        color,
      );
    }
    if (flowers)
      for (let i = 0; i < 12; i++)
        put(
          x + Math.sin(i * 2.3) * size * 0.6,
          y - size * 0.6 + Math.cos(i) * size * 0.23,
          "*",
          accent,
        );
  };
  for (let i = 0; i < 100; i++)
    if (i % 3 === 0)
      put(
        (((i * 37) % 181) / 181) * w,
        (((i * 19) % 71) / 71) * h * 0.55,
        Math.sin(t * 0.9 + i) > 0.6 ? "*" : ".",
        colors.distant,
      );
  // A shared depth order keeps forests and flowers in front of the horizon.
  if (
    [
      "sunrise",
      "alpine",
      "volcano",
      "storm",
      "lake",
      "stars",
      "aurora",
    ].includes(form)
  ) {
    if (form === "sunrise") oval(w * 0.64, h * 0.3, 9, 5, accent);
    else if (form !== "storm" && form !== "volcano")
      oval(w * 0.8, h * 0.17, 4.8, 3, accent);
    ridge(0.5, 3, colors.distant, 1);
    ridge(0.64, 4, bed, 4);
  }
  if (form === "cherry" || form === "autumn" || form === "redwoods") {
    ridge(0.86, 2, bed, 1);
    for (const x of [w * 0.13, w * 0.34, w * 0.75, w * 0.9])
      tree(
        x,
        h * 0.9,
        form === "redwoods" ? h * 0.87 : h * 0.65,
        plant,
        form === "cherry",
      );
    if (form !== "redwoods")
      for (let i = 0; i < 22; i++) {
        const phase = (t * 0.06 + i * 0.107) % 1;
        put(
          ((i * 0.173) % 1) * w + Math.sin(t * 0.6 + i) * 3,
          phase * h,
          form === "cherry" ? "+" : "v",
          accent,
        );
      }
  } else if (form === "bamboo") {
    for (let i = 0; i < 11; i++) {
      const x = w * (0.05 + i * 0.09),
        top = h * (0.04 + (i % 3) * 0.05);
      line(x, h * 0.97, x + 2, top, plant, "|");
      line(x + 2, h * 0.97, x + 4, top, plant, "|");
      for (let y = top + 4; y < h * 0.9; y += 7) {
        line(x, y, x + 3, y, accent, "=");
        line(x, y, x + (i % 2 ? 8 : -8), y - 4, plant, "/");
      }
    }
  } else if (form === "dunes") {
    oval(w * 0.76, h * 0.23, 6, 4, accent);
    ridge(0.52, 4, bed, 2);
    ridge(0.72, 5, plant, 4);
    ridge(0.87, 2, [195, 148, 105], 1);
    for (let i = 0; i < 4; i++) {
      const x = w * (0.1 + i * 0.24),
        y = h * 0.85;
      line(x, y, x, y - 8, bed, "#");
      line(x - 3, y - 4, x + 3, y - 4, bed, "=");
      line(x - 3, y - 4, x - 3, y - 7, bed, "|");
    }
  } else if (form === "snow") {
    ridge(0.7, 4, bed, 2);
    for (let i = 0; i < 9; i++)
      pine(w * (0.03 + i * 0.12), h * (0.78 + (i % 2) * 0.13), h * 0.42, plant);
    for (let i = 0; i < 40; i++)
      put(
        (((i * 31) % 181) / 181) * w + Math.sin(t * 0.4 + i) * 2,
        ((i * 0.071 + t * 0.035) % 1) * h,
        "*",
        accent,
      );
  } else if (form === "waterfall") {
    ridge(0.52, 2, bed, 2);
    polygon(
      [
        [w * 0.16, h * 0.24],
        [w * 0.35, h * 0.18],
        [w * 0.41, h * 0.78],
        [w * 0.12, h * 0.85],
      ],
      plant,
    );
    polygon(
      [
        [w * 0.62, h * 0.2],
        [w * 0.83, h * 0.25],
        [w * 0.87, h * 0.83],
        [w * 0.59, h * 0.77],
      ],
      plant,
    );
    for (let y = h * 0.25; y < h * 0.82; y++)
      line(
        w * 0.43,
        y,
        w * 0.57,
        y,
        Math.floor(y + t * 7) % 4 ? accent : [89, 155, 178],
        "|",
      );
    water(0.84);
  } else if (form === "sunflowers" || form === "wildflowers") {
    ridge(0.75, 3, bed, 3);
    for (let i = 0; i < 23; i++) {
      const x = ((i * 0.137) % 1) * w,
        y = h * (0.66 + (i % 4) * 0.08),
        size = form === "sunflowers" ? 2.3 : 1;
      line(x, y + 4, x + Math.sin(t * 0.6 + i) * 0.7, y, plant, "|");
      oval(x, y, size + 1, size * 0.7, accent);
      oval(x, y, size * 0.43, size * 0.3, bed);
    }
  } else if (form === "aurora") {
    for (let band = 0; band < 3; band++)
      for (let x = 0; x < w; x++) {
        const y =
          h * 0.24 + Math.sin(x * 0.045 + t * 0.13 + band) * 5 + band * 2;
        line(
          x,
          y,
          x,
          y + 4,
          [
            [107, 224, 178],
            [153, 185, 239],
            [203, 146, 232],
          ][band],
          ":",
        );
      }
    for (let i = 0; i < 7; i++)
      pine(w * (0.03 + i * 0.16), h * 0.98, h * (0.18 + (i % 3) * 0.05), plant);
  } else if (form === "lake" || form === "stars") {
    water(0.64);
    for (let i = 0; i < 30; i++)
      put(
        (((i * 29) % 173) / 173) * w,
        (((i * 17) % 37) / 37) * h * 0.45,
        Math.sin(t + i) > 0.45 ? "*" : ".",
        accent,
      );
  } else if (form === "volcano") {
    polygon(
      [
        [w * 0.25, h * 0.85],
        [w * 0.45, h * 0.28],
        [w * 0.55, h * 0.28],
        [w * 0.76, h * 0.85],
      ],
      plant,
    );
    line(w * 0.45, h * 0.28, w * 0.55, h * 0.28, accent, "=");
    for (let i = 0; i < 3; i++)
      line(
        w * 0.48 + i * 2,
        h * 0.3,
        w * (0.41 + i * 0.05) + Math.sin(t + i),
        h * 0.79,
        accent,
        ":",
      );
    for (let i = 0; i < 8; i++)
      oval(
        w * 0.5 + Math.sin(i + t * 0.2) * 3,
        h * 0.26 - ((i * 0.025 + t * 0.012) % 0.22) * h,
        3 + i * 0.25,
        1.5,
        [107, 107, 118],
      );
  } else if (form === "storm") {
    for (let i = 0; i < 8; i++)
      oval(
        ((i * 0.17 + t * 0.008) % 1) * w,
        h * (0.18 + (i % 3) * 0.05),
        14,
        3,
        bed,
      );
    water(0.68);
    for (let i = 0; i < 44; i++)
      put(
        (((i * 29) % 179) / 179) * w,
        ((i * 0.059 + t * 0.13) % 1) * h,
        "/",
        accent,
      );
  } else if (form === "sunrise" || form === "alpine") {
    for (let i = 0; i < 7; i++)
      pine(
        w * (0.04 + i * 0.15),
        h * (0.91 + (i % 2) * 0.05),
        h * (0.15 + (i % 3) * 0.04),
        plant,
      );
    if (form === "alpine")
      for (let i = 0; i < 12; i++)
        put(w * (0.03 + i * 0.085), h * 0.91, "*", accent);
  }
  return true;
}
