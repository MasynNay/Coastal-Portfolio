// Ambient game-world fan art, made with the same ASCII grid as the other
// modes. Hair, clothes, tools and familiar setting silhouettes identify the
// series. Actors use one coherent body origin for idle and action poses.
export function drawGameCharacter(art, kind, scene) {
  const { body, stroke, polygon, at, beat, time } = art;
  const skin = [245, 201, 162],
    cream = [240, 235, 205],
    brown = [139, 91, 62];
  const gold = [246, 208, 112],
    green = [109, 184, 119],
    blue = [112, 183, 222];
  const dark = [77, 85, 110],
    white = [242, 245, 236];
  const keyblade = (x, y) => {
    const swing = scene.food.length ? Math.sin(time * 7) * 4 : 0;
    stroke(x, y, x + swing, y - 10, gold, "#");
    stroke(x + swing, y - 9, x + swing + 3, y - 9, cream, "=");
    at(x + swing + 2, y - 8, "+", gold);
    body(x, y, 1.5, 1, gold);
  };
  const face = (color = skin) => {
    body(0, -5, 3.1, 2.9, color);
    at(1, -5, "o", dark);
  };
  const boots = (color = brown) => {
    body(-2, 7, 2, 1, color);
    body(2, 7, 2, 1, color);
  };
  const people = [
    "sora",
    "roxas",
    "kairi",
    "link",
    "toon-link",
    "skull-kid",
    "zora",
    "goofy",
    "jack",
  ];
  if (people.includes(kind)) {
    const outfit =
      kind === "kairi"
        ? [228, 130, 180]
        : ["link", "toon-link", "skull-kid"].includes(kind)
          ? green
          : kind === "zora"
            ? blue
            : dark;
    body(0, 1, 3.3, 4.2, outfit);
    stroke(-2, 4, -2, 7, outfit, "#");
    stroke(2, 4, 2, 7, outfit, "#");
    boots();
    face(kind === "zora" ? white : kind === "jack" ? cream : skin);
    body(-3.5, 1 + beat * 0.2, 1.2, 2.8, outfit);
    body(3.5, 1 - beat * 0.2, 1.2, 2.8, outfit);
    if (kind === "sora" || kind === "roxas") {
      const hair = kind === "roxas" ? gold : brown;
      polygon(
        [
          [-4, -5],
          [-5, -8],
          [-2, -7],
          [-1, -10],
          [1, -8],
          [4, -9],
          [3, -5],
        ],
        hair,
      );
      body(0, 3, 3, 1.7, kind === "sora" ? [223, 100, 96] : cream);
      stroke(-1, -1, 1, 2, cream, "X");
      boots(kind === "sora" ? gold : dark);
      keyblade(5, 2);
    } else if (kind === "kairi") {
      body(-2, -5, 1.3, 3.7, [184, 105, 92]);
      body(2, -5, 1.3, 3.7, [184, 105, 92]);
      polygon(
        [
          [-3, 1],
          [-4, 5],
          [4, 5],
          [3, 1],
        ],
        [232, 136, 181],
      );
    } else if (kind === "link" || kind === "toon-link") {
      polygon(
        [
          [-3, -6],
          [-2, -9],
          [2, -8],
          [5, -5],
          [1, -6],
        ],
        green,
      );
      stroke(-2, -6, 2, -6, gold, "#");
      stroke(-3, 2, 3, 2, brown, "=");
      polygon(
        [
          [-4, 0],
          [-6, 1],
          [-5, 5],
          [-3, 4],
        ],
        blue,
      );
      at(-4.5, 2.5, "+", gold);
      stroke(5, 3, 5 + (scene.food.length ? beat * 3 : 0), -5, white, "|");
    } else if (kind === "skull-kid") {
      polygon(
        [
          [-5, -6],
          [-2, -10],
          [0, -8],
          [3, -9],
          [5, -5],
        ],
        [221, 164, 91],
      );
      stroke(-2, -2, 2, -2, [232, 132, 112], "~");
      stroke(2, -2, 6, -2, gold, "=");
    } else if (kind === "zora") {
      polygon(
        [
          [-3, -5],
          [0, -10],
          [5, -5],
          [2, -6],
        ],
        blue,
      );
      polygon(
        [
          [-3, 0],
          [-7, 3],
          [-3, 3],
        ],
        white,
      );
      polygon(
        [
          [3, 0],
          [7, 3],
          [3, 3],
        ],
        white,
      );
    } else if (kind === "goofy") {
      body(0, -7, 2.7, 1.6, green);
      stroke(-4, -5, -4, -1, brown, "#");
      body(2, -3.8, 3, 1.5, cream);
      body(4, -4, 1, 0.8, dark);
      body(0, 0, 2.6, 2, [228, 154, 92]);
    } else if (kind === "jack") {
      at(-1, -5, "o", dark);
      at(1, -5, "o", dark);
      stroke(-2, -3.7, 2, -3.7, dark, "=");
      for (let i = -2; i <= 2; i += 2) stroke(i, -1, i, 5, cream, ":");
    }
    return true;
  }
  if (kind === "donald") {
    body(0, 2, 3.3, 4, blue);
    body(0, -4, 3.7, 3, white);
    body(3, -3, 3, 1.1, gold);
    body(0, -7, 3, 1, blue);
    at(1, -5, "o", dark);
    body(-2, 7, 2, 0.8, gold);
    body(2, 7, 2, 0.8, gold);
    stroke(-4, 1, -6, -7, brown, "|");
    at(-6, -7, "*", gold);
    return true;
  }
  if (kind === "shadow") {
    body(0, -2, 4, 3, dark);
    body(0, 3, 2.3, 3, dark);
    at(-1.5, -2, "O", gold);
    at(1.5, -2, "O", gold);
    stroke(-2, -4, -4 + beat * 0.4, -8, dark, "~");
    stroke(2, -4, 4 - beat * 0.4, -8, dark, "~");
    stroke(-1, 4, -4, 7, dark, "#");
    stroke(1, 4, 4, 7, dark, "#");
    return true;
  }
  if (kind === "fairy") {
    body(0, 0, 1.2, 1.2, [235, 240, 169]);
    body(-3, -1, 2.3, 1 + Math.abs(beat), blue);
    body(3, -1, 2.3, 1 + Math.abs(beat), blue);
    at(0, 0, "*", white);
    return true;
  }
  return false;
}

export function drawGameLandscape(grid, scene) {
  const { style, time } = scene;
  if (["cove", "springs"].includes(style.setting)) return false;
  const { columns: w, rows: h, oval, line, put, polygon } = grid;
  const stone = [137, 151, 177],
    green = style.plant,
    cream = [238, 221, 173];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if ((x * 29 + y * 31) % 109 < 3) put(x, y, ".", style.accent);
      if (y > h * 0.8) put(x, y, (x + y) % 5 ? "." : ":", style.bed);
    }
  const setting = style.setting;
  if (setting === "keys") {
    for (let i = 0; i < 17; i++) {
      const x = w * (i / 18 + 0.03),
        y = h * (0.36 + (i % 4) * 0.06);
      line(x, h * 0.78, x + 1, y, stone, "|");
      atKey(grid, x + 1, y, cream);
    }
    oval(w * 0.16, h * 0.75, 12, 2, stone);
    oval(w * 0.84, h * 0.75, 9, 2, stone);
    return true;
  }
  if (
    ["town", "clocktower", "bastion", "haunted", "temple", "field"].includes(
      setting,
    )
  ) {
    const towers = setting === "temple" ? 5 : 3;
    for (let i = 0; i < towers; i++) {
      const x = w * (0.2 + (i / (towers - 1)) * 0.6),
        height = i % 2 ? h * 0.21 : h * 0.31;
      polygon(
        [
          [x - 5, h * 0.43],
          [x - 5, h * 0.43 - height],
          [x + 5, h * 0.43 - height],
          [x + 5, h * 0.43],
        ],
        stone,
      );
      polygon(
        [
          [x - 7, h * 0.43 - height],
          [x, h * 0.43 - height - 3],
          [x + 7, h * 0.43 - height],
        ],
        style.accent,
      );
      for (let y = h * 0.43 - height + 3; y < h * 0.41; y += 5)
        oval(x, y, 1, 1.3, cream);
    }
    if (setting === "clocktower") {
      oval(w / 2, h * 0.22, 4, 3, cream);
      line(w / 2, h * 0.22, w / 2, h * 0.18, stone, "|");
    }
    if (setting === "temple") {
      polygon(
        [
          [w * 0.47, h * 0.78],
          [w * 0.48, h * 0.7],
          [w * 0.52, h * 0.7],
          [w * 0.53, h * 0.78],
        ],
        stone,
      );
      line(w / 2, h * 0.72, w / 2, h * 0.5, cream, "|");
    }
  } else if (["islands", "harbor", "waterfalls"].includes(setting)) {
    for (let y = h * 0.3; y < h * 0.8; y++)
      for (let x = 0; x < w; x++)
        if ((x + Math.round(time * 2) + y) % 7 === 0)
          put(x, y, "~", [114, 195, 220]);
    if (setting === "islands") {
      for (const x of [w * 0.16, w * 0.82]) {
        line(x, h * 0.75, x - 3, h * 0.2, [174, 137, 105], "#");
        for (let i = -3; i <= 3; i++)
          line(
            x - 3,
            h * 0.2,
            x - 3 + i * 4,
            h * 0.2 + Math.abs(i) * 2,
            green,
            "+",
          );
      }
    } else if (setting === "waterfalls") {
      for (const x of [w * 0.18, w * 0.8])
        for (let y = 3; y < h * 0.68; y++)
          line(
            x,
            y,
            x + 5,
            y,
            (y + Math.floor(time * 6)) % 4 ? [126, 204, 226] : cream,
            "|",
          );
    } else {
      // Red hull, horned figurehead and cream sail identify the harbor boat.
      polygon(
        [
          [w * 0.52, h * 0.7],
          [w * 0.72, h * 0.73],
          [w * 0.78, h * 0.66],
          [w * 0.74, h * 0.8],
          [w * 0.55, h * 0.79],
        ],
        [230, 122, 102],
      );
      line(w * 0.64, h * 0.72, w * 0.64, h * 0.18, cream, "|");
      polygon(
        [
          [w * 0.64, h * 0.2],
          [w * 0.64, h * 0.65],
          [w * 0.48, h * 0.65],
        ],
        cream,
      );
      oval(w * 0.78, h * 0.64, 3, 2, [224, 125, 99]);
      put(w * 0.78, h * 0.59, "V", cream);
    }
  } else if (setting === "clouds") {
    for (let i = 0; i < 7; i++)
      oval(
        ((i * 0.173 + time * 0.003) % 1) * w,
        h * (0.25 + (i % 3) * 0.22),
        12,
        3.5,
        [137, 183, 205],
      );
  } else {
    for (const fraction of [0.06, 0.22, 0.78, 0.94]) {
      const x = w * fraction;
      line(x, h * 0.8, x, h * 0.15, [134, 116, 91], "#");
      oval(x, h * 0.13, 12, 6, green);
      oval(x - 5, h * 0.25, 9, 4, green);
    }
    if (setting === "pumpkins")
      for (let i = 0; i < 8; i++) {
        oval(w * (0.1 + i * 0.11), h * 0.77, 3, 2, [232, 156, 98]);
        put(w * (0.1 + i * 0.11), h * 0.77, "v", cream);
      }
    if (setting === "keys")
      for (let i = 0; i < 17; i++) {
        const x = w * (i / 18 + 0.03);
        line(x, h * 0.78, x + 1, h * (0.36 + (i % 4) * 0.06), stone, "|");
        atKey(grid, x + 1, h * (0.36 + (i % 4) * 0.06), cream);
      }
  }
  return true;
}
function atKey(grid, x, y, color) {
  grid.line(x, y, x + 3, y, color, "=");
  grid.put(x + 2, y + 1, "+", color);
}

export function drawGameEffects(grid, scene) {
  const action = scene.style.action,
    time = scene.time;
  scene.food.forEach((p, i) => {
    const x = p.x * grid.columns,
      y = p.y * grid.rows;
    if (action === "thunder") {
      const flash = p.age < 1.2;
      if (flash)
        for (let j = 0; j < 8; j++)
          grid.put(
            x + (j % 2 ? 2 : 0),
            y + j,
            j % 2 ? "/" : "\\",
            [255, 229, 123],
          );
    } else if (action === "hearts") {
      for (const [dx, dy, glyph] of [
        [-1, 0, "<"],
        [0, -1, "3"],
        [1, 0, ">"],
        [0, 1, "v"],
      ])
        grid.put(x + dx, y + dy, glyph, [244, 169, 201]);
    } else if (action === "keyblade")
      atKey(grid, x + Math.sin(time * 3 + i) * 2, y, [246, 218, 147]);
    else {
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2 + time;
        grid.put(
          x + Math.cos(a) * (1 + p.age),
          y + Math.sin(a) * (1 + p.age) * 0.6,
          action === "fairies" ? "+" : "*",
          scene.style.accent,
        );
      }
    }
  });
}
