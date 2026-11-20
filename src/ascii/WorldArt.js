// Additional residents and settings use the same character-grid primitives as
// the aquariums. Each setting has its own silhouette and motion, not just a
// different background color. No external images or animation downloads.
export function drawWorldCreature(art, kind, index) {
  const { body, stroke, at, polygon, beat, time } = art;
  const white = [233, 244, 239],
    dark = [18, 33, 48];
  const blue = [122, 191, 218],
    pink = [240, 160, 190];
  const gold = [253, 203, 121],
    green = [137, 211, 119];
  const eyes = (x, y) => {
    at(x, y, "O", white);
    at(x + 0.5, y, ".", dark);
  };
  if (kind === "axolotl") {
    const color = [pink, white, gold][index % 3];
    polygon(
      [
        [-4, -1],
        [-11, -2 + beat],
        [-9, 2],
        [-4, 1],
      ],
      color,
    );
    body(-1, 0, 5, 2.4, color);
    body(4, -0.5, 3.8, 2.7, color);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++)
        stroke(2 + i, side * 1.3, 1 + i * 2, side * (4 + (i % 2)), pink, "*");
      stroke(-3, side, -4, side * (3 + beat * 0.2), color, "/");
      stroke(1, side, 2, side * 3, color, "/");
    }
    eyes(5, -1);
    stroke(5, 1, 6.5, 1, dark, "_");
    return true;
  }
  if (kind === "octopus") {
    const color = index % 2 ? pink : [215, 161, 230];
    for (let arm = -3; arm <= 3; arm++) {
      for (let step = 0; step < 7; step++)
        at(
          arm * 1.5 + Math.sin(time * 2 + arm + step * 0.3) * step * 0.3,
          2 + step * 0.6,
          step % 2 ? "o" : "#",
          color,
        );
    }
    body(0, -1, 5, 4.5, color);
    eyes(2, -1);
    at(2, 1, "o", dark);
    return true;
  }
  if (kind === "crab") {
    const color = [240, 145, 107];
    for (let i = 0; i < 3; i++) {
      stroke(-2, 1 + i, -6 + beat * 0.4, 2 + i, color, "/");
      stroke(2, 1 + i, 6 - beat * 0.4, 2 + i, color, "\\");
    }
    body(0, 0, 4, 2.4, color);
    for (const side of [-1, 1]) {
      stroke(side * 3, 0, side * 6, -2, color, "/");
      body(side * 6, -3, 1.7, 1.3, color);
      at(side * 6, -4, "V", white);
      stroke(side, -1, side * 1.5, -3, color, "|");
      eyes(side * 1.5, -3);
    }
    return true;
  }
  if (kind === "ray") {
    polygon(
      [
        [-1, -1],
        [-8, -5 - beat],
        [-7, 0],
        [-4, 3],
        [0, 3],
        [4, 3],
        [7, 0],
        [8, -5 + beat],
        [1, -1],
      ],
      blue,
    );
    body(0, 0, 3, 3, blue, (u, v) =>
      Math.sin(u * 14) * Math.cos(v * 12) > 0.55 ? white : blue,
    );
    stroke(-1, 2, -2, 8, blue, "~");
    eyes(1.2, -1.5);
    return true;
  }
  if (kind === "shark") {
    polygon(
      [
        [-6, 0],
        [-11, -4],
        [-9, 0],
        [-11, 3],
        [-6, 1],
      ],
      blue,
    );
    polygon(
      [
        [-1, -1],
        [0, -6],
        [3, -1],
      ],
      blue,
    );
    polygon(
      [
        [0, 1],
        [-3, 5 + beat * 0.2],
        [4, 1],
      ],
      blue,
    );
    body(0, 0, 7, 2.5, blue);
    body(1, 1, 5, 1, white);
    eyes(4, -0.8);
    stroke(3, 1, 6, 1, dark, "_");
    for (let i = 0; i < 3; i++) stroke(1 - i, -0.6, 0.8 - i, 1, dark, "/");
    return true;
  }
  if (kind === "penguin") {
    polygon(
      [
        [-4, 0],
        [-8, -2],
        [-7, 2],
        [-3, 1],
      ],
      dark,
    );
    body(-1, 0, 5.4, 2.7, [65, 92, 119]);
    body(0, 1, 4, 1.6, white);
    body(4, -1, 2.7, 2.5, [65, 92, 119]);
    body(5, -0.8, 1.5, 1.6, white);
    polygon(
      [
        [6, -1],
        [9, 0],
        [6, 0.5],
      ],
      gold,
    );
    stroke(-1, 0, -3, 4 + beat, blue, "\\");
    eyes(5, -1.5);
    return true;
  }
  if (kind === "seal") {
    polygon(
      [
        [-5, 0],
        [-10, -2],
        [-9, 2],
        [-5, 2],
      ],
      blue,
    );
    body(-1, 0, 6, 3, [173, 205, 213]);
    body(5, -1, 3, 2.8, [190, 217, 223]);
    body(6, 0, 1.7, 1.3, white);
    at(7, -0.5, "o", dark);
    eyes(5, -2);
    for (let i = -1; i <= 1; i++) stroke(6, 0, 9, i, white, "-");
    body(-1, 3, 3, 1 + beat * 0.2, blue);
    return true;
  }
  if (kind === "butterfly") {
    const color = [pink, [168, 163, 248], gold][index % 3];
    const spread = 2 + Math.abs(Math.sin(time * 3 + index)) * 2;
    body(-spread, -1, spread, 3.8, color);
    body(spread, -1, spread, 3.8, color);
    body(-spread * 0.7, 3, spread * 0.75, 2, color);
    body(spread * 0.7, 3, spread * 0.75, 2, color);
    stroke(0, -3, 0, 4, white, "#");
    stroke(0, -3, -2, -5, gold, "/");
    stroke(0, -3, 2, -5, gold, "\\");
    at(-spread, -1, "o", white);
    at(spread, -1, "o", white);
    return true;
  }
  if (kind === "firefly") {
    const glow = 0.4 + Math.sin(time * 2 + index) ** 2 * 0.6;
    body(0, 1, 1.5, 1.8, [Math.round(240 * glow), Math.round(245 * glow), 126]);
    body(-1.5, -0.5, 1.5, 0.5 + Math.abs(beat) * 0.8, blue);
    body(1.5, -0.5, 1.5, 0.5 + Math.abs(beat) * 0.8, blue);
    at(0, -1, "+", white);
    return true;
  }
  if (kind === "frog") {
    body(0, 1, 4, 3, green);
    body(2, -1, 3.8, 2.4, green);
    body(3, 2, 2.1, 1.5, gold);
    for (const side of [-1, 1]) {
      body(-2, side * 2, 2, 1.5, green);
      stroke(-2, side * 2, -5, side * 3, green, "<");
    }
    body(3, -3, 1.3, 1.3, green);
    eyes(3.5, -3);
    stroke(3, 0, 5, 0, dark, "_");
    return true;
  }
  if (kind === "rocket") {
    polygon(
      [
        [-4, -2],
        [-8 - beat, 0],
        [-4, 2],
      ],
      gold,
    );
    polygon(
      [
        [-4, -2],
        [2, -2],
        [6, 0],
        [2, 2],
        [-4, 2],
      ],
      white,
    );
    polygon(
      [
        [-3, -2],
        [-5, -5],
        [0, -2],
      ],
      pink,
    );
    polygon(
      [
        [-3, 2],
        [-5, 5],
        [0, 2],
      ],
      pink,
    );
    body(1, 0, 1.3, 1.1, blue);
    return true;
  }
  if (kind === "ufo") {
    body(0, -1.5, 3.2, 2.7, blue);
    body(0, 0.5, 6, 1.4, [183, 179, 216]);
    for (let i = -3; i <= 3; i += 2) at(i, 1, "*", gold);
    return true;
  }
  if (kind === "satellite") {
    polygon(
      [
        [-6, -3],
        [-2, -3],
        [-2, 3],
        [-6, 3],
      ],
      blue,
    );
    polygon(
      [
        [2, -3],
        [6, -3],
        [6, 3],
        [2, 3],
      ],
      blue,
    );
    body(0, 0, 1.7, 2, white);
    stroke(0, -1, 1, -5, gold, "/");
    at(1, -5, "o", gold);
    return true;
  }
  if (kind === "sky-lantern") {
    body(0, 0, 3.5, 4.5, index % 2 ? pink : gold);
    stroke(-2, -3, -2, 3, white, "|");
    stroke(2, -3, 2, 3, white, "|");
    stroke(-2, 4, 2, 4, gold, "=");
    stroke(0, 4, Math.sin(time + index), 7, gold, "~");
    at(0, 3, "*", white);
    return true;
  }
  return false;
}

export function drawWorldLandscape(grid, scene) {
  const { style, time } = scene;
  if (!["space", "sky", "meadow", "terrarium"].includes(style.landscape))
    return false;
  const { columns: w, rows: h, put, oval, line } = grid;
  // Stable seeded-looking stars, rather than random sparkle positions per
  // frame. Gardens use the same distant sky but add rooted foreground plants.
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const n = (x * 37 + y * 61) % 113;
      if (n < 5) put(x, y, n === 0 ? "+" : ".", style.accent);
      if (y > h * 0.67 && style.landscape !== "space") {
        const ridge = h * 0.78 + Math.sin(x * 0.06) * 5;
        if (y > ridge) put(x, y, ".:-"[(x + y) % 3], style.bed);
      }
    }
  if (style.landscape === "space") {
    oval(w * 0.24, h * 0.25, 9, 5, [228, 171, 151]);
    for (let i = -14; i <= 14; i++)
      put(w * 0.24 + i, h * 0.25 + Math.sin(i * 0.1) * 2, "=", [197, 172, 211]);
    oval(w * 0.78, h * 0.7, 10, 6, [103, 165, 207]);
    oval(w * 0.52, h * 0.12, 2, 1.5, [218, 221, 236]);
  } else {
    oval(w * 0.78, h * 0.14, 5, 3.5, [224, 225, 203]);
    if (style.landscape !== "sky") {
      for (let i = 0; i < 17; i++) {
        const x = ((i * 0.173 + 0.03) % 1) * w;
        const y = h - 4 - (i % 5) * 2;
        line(x, h - 1, x + Math.sin(time + i), y, style.plant, "|");
        oval(
          x,
          y,
          i % 2 ? 2.5 : 1.5,
          1.5,
          i % 3 ? [215, 158, 198] : style.accent,
        );
        put(x, y, "*", [255, 223, 140]);
      }
    }
    if (style.landscape === "terrarium") {
      line(0, h * 0.65, w * 0.88, h * 0.54, [150, 130, 100], "#");
      for (let i = 0; i < 8; i++) oval((w * i) / 8, h * 0.1, 7, 3, style.plant);
    }
  }
  return true;
}

export function drawHabitatDetails(grid, scene) {
  const { columns: w, rows: h, oval, line, put } = grid;
  const { landscape, accent, plant } = scene.style;
  if (landscape === "pond") {
    for (const x of [0.14, 0.56, 0.86]) {
      oval(w * x, h * 0.1, 8, 1.6, plant);
      line(w * x, h * 0.1, w * x + 7, h * 0.1, [12, 31, 35], " ");
      put(w * x - 3, h * 0.1 - 2, "*", [251, 184, 207]);
    }
  }
  if (landscape === "rocks") {
    oval(w * 0.2, h - 8, 15, 7, [105, 126, 149]);
    oval(w * 0.2, h - 6, 8, 5, scene.style.water);
    oval(w * 0.8, h - 6, 13, 5, [126, 132, 162]);
  }
  if (landscape === "ice") {
    for (let x = 0; x < w; x++)
      for (let y = 0; y < 3 + Math.sin(x * 0.09) * 2; y++)
        put(x, y, "#", accent);
  }
  if (landscape === "mangrove") {
    for (const x of [0.05, 0.3, 0.72, 0.94]) {
      line(w * x, 0, w * x + 5, h * 0.7, [138, 141, 104], "#");
      line(w * x + 3, h * 0.35, w * x - 9, h * 0.75, [138, 141, 104], "#");
    }
  }
}
