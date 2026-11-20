// Background architecture stays in the upper third or between actors. Large
// towers behind a character's face made the earlier scenes hard to read.
export function drawGameScenery(grid, scene) {
  const { columns: w, rows: h, line, polygon, oval, put } = grid;
  const { setting, accent } = scene.style;
  const stone = [82, 103, 131],
    roof = [112, 121, 161],
    gold = [244, 214, 133];
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
  const triangle = (x, y, size, color) =>
    polygon(
      [
        [x, y],
        [x - size, y + size],
        [x + size, y + size],
      ],
      color,
    );
  const triforce = (x, y, size) => {
    triangle(x, y, size, gold);
    triangle(x - size, y + size, size, gold);
    triangle(x + size, y + size, size, gold);
  };
  const stars = () => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if ((x * 29 + y * 31) % 193 === 0) put(x, y, ".", [83, 104, 131]);
    for (let x = 0; x < w; x++)
      line(x, h * 0.88, x, h * 0.92, [58, 78, 93], x % 4 ? " " : ".");
  };
  const turret = (x, base, height, width = 5) => {
    box(x - width, base - height, width * 2, height, stone);
    triangle(x, base - height - 4, width + 2, roof);
    for (let y = base - height + 3; y < base - 2; y += 4)
      put(x, y, "o", accent);
  };
  if (
    !["field", "temple", "town", "clocktower", "bastion", "haunted"].includes(
      setting,
    )
  )
    return false;
  stars();
  if (setting === "haunted") {
    oval(w * 0.18, h * 0.14, 7, 4, [185, 177, 221]);
    // The tower occupies the gap between the two Gengar, never their faces.
    polygon(
      [
        [w * 0.46, h * 0.49],
        [w * 0.47, h * 0.24],
        [w * 0.48, h * 0.24],
        [w * 0.47, h * 0.12],
        [w * 0.53, h * 0.12],
        [w * 0.54, h * 0.49],
      ],
      stone,
    );
    polygon(
      [
        [w * 0.45, h * 0.12],
        [w * 0.5, h * 0.03],
        [w * 0.55, h * 0.12],
      ],
      roof,
    );
    for (let y = h * 0.18; y < h * 0.44; y += 5) {
      oval(w * 0.5, y, 1.6, 1.3, gold);
      line(w * 0.5, y - 1, w * 0.5, y + 1, stone, "|");
    }
    for (let i = 0; i < 4; i++) {
      const x = w * (0.08 + i * 0.27);
      put(x, h * 0.23 + Math.sin(scene.time + i), i % 2 ? "/" : "~", roof);
    }
  } else if (setting === "field") {
    // Hyrule's distant keep, red pennants, and three golden triangles.
    turret(w * 0.72, h * 0.35, h * 0.18, 6);
    turret(w * 0.91, h * 0.35, h * 0.18, 5);
    box(w * 0.75, h * 0.19, w * 0.13, h * 0.16, stone);
    triforce(w * 0.815, h * 0.14, 2);
    for (const x of [w * 0.72, w * 0.91]) {
      line(x, h * 0.07, x, h * 0.12, stone, "|");
      polygon(
        [
          [x, h * 0.07],
          [x + 5, h * 0.08],
          [x, h * 0.1],
        ],
        [204, 100, 115],
      );
    }
    for (let i = 0; i < 4; i++)
      line(
        w * (0.02 + i * 0.1),
        h * 0.32,
        w * (0.1 + i * 0.1),
        h * 0.27,
        [69, 119, 97],
        "~",
      );
  } else if (setting === "temple") {
    const left = w * 0.12,
      right = w * 0.88;
    for (const x of [left, right]) {
      box(x - 3, h * 0.09, 6, h * 0.64, stone);
      box(x - 5, h * 0.08, 10, 2, roof);
      box(x - 5, h * 0.73, 10, 2, roof);
      line(x, h * 0.14, x, h * 0.68, [143, 156, 177], "|");
    }
    line(left, h * 0.09, w * 0.5, h * 0.02, roof, "/");
    line(w * 0.5, h * 0.02, right, h * 0.09, roof, "\\");
    triforce(w * 0.5, h * 0.13, 3);
    // Master Sword, blue hilt and broad pedestal, in the open center aisle.
    box(w * 0.48, h * 0.75, w * 0.04, 3, stone);
    box(w * 0.46, h * 0.81, w * 0.08, 2, roof);
    line(w * 0.5, h * 0.58, w * 0.5, h * 0.75, [230, 237, 232], "|");
    line(w * 0.47, h * 0.58, w * 0.53, h * 0.58, [104, 134, 227], "=");
    line(w * 0.5, h * 0.53, w * 0.5, h * 0.58, [104, 134, 227], "#");
  } else if (setting === "clocktower") {
    box(w * 0.46, h * 0.1, w * 0.08, h * 0.36, stone);
    triangle(w * 0.5, h * 0.01, w * 0.055, roof);
    oval(w * 0.5, h * 0.19, 4, 3, gold);
    line(w * 0.5, h * 0.19, w * 0.5, h * 0.15, stone, "|");
    line(w * 0.5, h * 0.19, w * 0.53, h * 0.19, stone, "-");
    for (const x of [w * 0.08, w * 0.86]) {
      box(x, h * 0.15, w * 0.08, h * 0.2, [100, 92, 131]);
      triangle(x + w * 0.04, h * 0.08, w * 0.06, [170, 122, 116]);
    }
  } else if (setting === "town") {
    for (let i = 0; i < 5; i++) {
      const x = w * (0.03 + i * 0.2),
        y = h * (0.14 + (i % 2) * 0.035);
      box(x, y, w * 0.14, h * 0.16, [91, 93 + i * 4, 121]);
      polygon(
        [
          [x - 2, y],
          [x + w * 0.06, y - 5],
          [x + w * 0.16, y],
        ],
        i % 2 ? [158, 107, 130] : [111, 121, 164],
      );
      for (let j = 0; j < 3; j++) box(x + 3 + j * 5, y + 3, 2, 2, gold);
    }
    for (const x of [w * 0.08, w * 0.91]) {
      line(x, h * 0.48, x, h * 0.7, stone, "|");
      oval(x, h * 0.46, 2, 2, gold);
    }
  } else {
    // Hollow Bastion's floating spires and sweeping aqueduct, away from faces.
    for (let i = 0; i < 5; i++)
      turret(
        w * (0.3 + i * 0.1),
        h * (0.29 + (i % 2) * 0.05),
        h * (0.12 + (i % 3) * 0.02),
        3,
      );
    for (let x = w * 0.3; x < w * 0.7; x++)
      put(
        x,
        h * 0.38 + Math.sin((x / w - 0.3) * Math.PI * 2) * 2,
        "~",
        [112, 170, 195],
      );
  }
  return true;
}
