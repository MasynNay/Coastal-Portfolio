// Ambient game-world fan art, made with the same ASCII grid as the other
// modes. Hair, clothes, tools and familiar setting silhouettes identify the
// series. Actors use one coherent body origin for idle and action poses.
import { drawCharacterCells } from "./CharacterArt";
import { drawGameScenery } from "./GameScenery";
import { drawStoryLandscape } from "./StoryArt";

export function drawGameCharacter(art, kind, scene) {
  if (drawCharacterCells(art, kind, scene)) return true;
  const { body, at, beat } = art;
  const blue = [112, 183, 222],
    white = [242, 245, 236];
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
  if (drawGameScenery(grid, scene) || drawStoryLandscape(grid, scene))
    return true;
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
  if (["islands", "harbor", "waterfalls"].includes(setting)) {
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
    if (action === "rain") {
      for (let j = 0; j < 9; j++)
        grid.put(
          (x + j * 13) % grid.columns,
          (p.age * 11 + j * 5) % grid.rows,
          "/",
          [119, 178, 204],
        );
    } else if (action === "butterflies") {
      const wing = Math.sin(time * 7 + i) > 0 ? "v" : "^";
      grid.put(
        x + Math.sin(time + i) * 5,
        y + Math.cos(time + i) * 3,
        wing,
        [244, 193, 133],
      );
      grid.put(
        x + Math.sin(time + i) * 5 + 1,
        y + Math.cos(time + i) * 3,
        wing,
        [235, 155, 189],
      );
    } else if (action === "lanterns") {
      const up = grid.rows * (0.8 - p.age * 0.12);
      grid.oval(x, up, 1.8, 2, [245, 187, 117]);
      grid.put(x, up, "*", [255, 239, 178]);
    } else if (action === "wind") {
      for (let j = 0; j < 30; j++) {
        const a = j * 0.18 + time * 2,
          r = 2 + p.age * 1.8;
        grid.put(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r * 0.55,
          j % 3 ? "~" : ".",
          [173, 223, 221],
        );
      }
    } else if (action === "thunder") {
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
