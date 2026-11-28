import { tops, bottoms, hairColors, wardrobeOwner } from "./CustomWardrobe";

// The original illustrated poses remain untouched. A bounded frame cache
// recolors only opaque garment/hair pixels and paints small costume details
// on the same atlas cell, preserving frame alignment and the actual body.
const frames = new Map();
const maxFrames = 128;
const rgb = (hex) =>
  hex && [1, 3, 5].map((n) => parseInt(hex.slice(n, n + 2), 16));
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const isSkin = (r, g, b) =>
  r > 115 && r > g * 1.13 && g > b * 1.12 && r - b > 33;
const isHair = (r, g, b, owner) =>
  owner === "mi-shell"
    ? Math.max(r, g, b) < 105 && Math.abs(r - b) < 42
    : r > g * 1.12 && g > b * 1.13 && r < 197;

function shadePixel(pixels, i, target, finish, y, body) {
  if (!target) return;
  const brightest = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
  if (brightest < 32) return; // preserve dark illustrated outlines
  let value = 0.42 + (brightest / 255) * 0.85;
  if (finish === "stripe" && Math.floor(y / Math.max(2, body * 0.07)) % 3 === 0)
    value *= 1.2;
  if (finish === "trim" && y % Math.max(3, Math.round(body * 0.13)) < 1.8)
    value *= 1.13;
  for (let c = 0; c < 3; c++) pixels[i + c] = clamp(target[c] * value);
}

function polygon(ctx, points, fill, stroke = "#24232a") {
  ctx.beginPath();
  points.forEach(([x, y], i) =>
    i
      ? ctx.lineTo(Math.round(x), Math.round(y))
      : ctx.moveTo(Math.round(x), Math.round(y)),
  );
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
function oval(ctx, x, y, rx, ry, fill, stroke = "#27242a") {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function headAccessories(ctx, look, head, body, direction, hairSample) {
  const { x, y, width: w } = head,
    rear = [3, 4, 5].includes(direction);
  const hair = hairColors[look.hairColor]?.color || hairSample;
  // Use the existing hair silhouette as the root. Styles add small crown
  // and half-up details, never cover the face or erase long natural hair.
  if (look.hair === "halfUp")
    oval(ctx, x, y - body * 0.025, w * 0.21, body * 0.056, hair);
  if (look.hair === "twinBuns") {
    oval(ctx, x - w * 0.32, y + body * 0.025, w * 0.15, body * 0.065, hair);
    oval(ctx, x + w * 0.32, y + body * 0.025, w * 0.15, body * 0.065, hair);
  }
  if (look.hair === "spiky")
    polygon(
      ctx,
      [
        [x - w * 0.44, y + body * 0.06],
        [x - w * 0.25, y - body * 0.075],
        [x - w * 0.08, y - body * 0.025],
        [x + w * 0.07, y - body * 0.09],
        [x + w * 0.2, y - body * 0.015],
        [x + w * 0.42, y + body * 0.065],
      ],
      hair,
      "#4e3025",
    );
  if (look.hair === "swept")
    polygon(
      ctx,
      [
        [x - w * 0.44, y + body * 0.075],
        [x - w * 0.16, y - body * 0.028],
        [x + w * 0.37, y + body * 0.025],
        [x + w * 0.16, y + body * 0.1],
      ],
      hair,
      "#47342c",
    );
  if (look.hair === "clip" || look.hair === "ribbon") {
    const hx = x + w * 0.36,
      hy = y + body * 0.1;
    if (look.hair === "clip")
      polygon(
        ctx,
        [
          [hx - 4, hy - 2],
          [hx + 4, hy - 4],
          [hx + 5, hy],
          [hx - 3, hy + 2],
        ],
        "#e4b969",
      );
    else {
      polygon(
        ctx,
        [
          [hx, hy],
          [hx - 7, hy - 5],
          [hx - 7, hy + 4],
        ],
        "#bd5e76",
      );
      polygon(
        ctx,
        [
          [hx, hy],
          [hx + 7, hy - 5],
          [hx + 7, hy + 4],
        ],
        "#bd5e76",
      );
    }
  }
  const l = x - w * 0.53,
    r = x + w * 0.53,
    crown = y + body * 0.08;
  switch (look.hat) {
    case "trainer":
      oval(ctx, x, crown, w * 0.55, body * 0.075, "#f2dfdb", "#472b34");
      polygon(
        ctx,
        [
          [l, crown],
          [x, crown - body * 0.08],
          [r, crown],
          [x + w * 0.6, crown + body * 0.037],
          [l, crown + body * 0.04],
        ],
        "#c83d41",
      );
      if (!rear)
        oval(
          ctx,
          x + w * 0.23,
          crown + body * 0.043,
          w * 0.5,
          body * 0.027,
          "#a32c35",
        );
      break;
    case "beanie":
      oval(ctx, x, crown - body * 0.02, w * 0.57, body * 0.096, "#505b7b");
      polygon(
        ctx,
        [
          [l, crown],
          [r, crown],
          [r, crown + body * 0.035],
          [l, crown + body * 0.035],
        ],
        "#8794b0",
      );
      break;
    case "band":
      polygon(
        ctx,
        [
          [l, y + body * 0.085],
          [r, y + body * 0.085],
          [r, y + body * 0.13],
          [l, y + body * 0.13],
        ],
        "#375b94",
      );
      if (!rear)
        polygon(
          ctx,
          [
            [x - 3, y + body * 0.09],
            [x + 3, y + body * 0.09],
            [x + 3, y + body * 0.125],
            [x - 3, y + body * 0.125],
          ],
          "#d6bd6c",
        );
      break;
    case "scout":
      oval(ctx, x, crown, w * 0.56, body * 0.075, "#467d55");
      if (!rear)
        oval(
          ctx,
          x + w * 0.18,
          crown + body * 0.04,
          w * 0.54,
          body * 0.026,
          "#2e513c",
        );
      break;
    case "crown":
      polygon(
        ctx,
        [
          [l, crown + 2],
          [l, crown - body * 0.09],
          [x - w * 0.27, crown - body * 0.025],
          [x, crown - body * 0.12],
          [x + w * 0.27, crown - body * 0.025],
          [r, crown - body * 0.09],
          [r, crown + 2],
        ],
        "#cfaa58",
        "#644725",
      );
      oval(ctx, x, crown - 3, w * 0.085, body * 0.027, "#5ed0bd", "#78552f");
      break;
    case "wizard":
      polygon(
        ctx,
        [
          [x - w * 0.44, y],
          [x + w * 0.01, y - body * 0.19],
          [x + w * 0.31, y - body * 0.1],
          [x + w * 0.5, y],
        ],
        "#49446e",
      );
      oval(ctx, x, y + body * 0.025, w * 0.67, body * 0.033, "#39365a");
      break;
    case "bucket":
      polygon(
        ctx,
        [
          [x - w * 0.44, y - body * 0.035],
          [x + w * 0.44, y - body * 0.035],
          [r, crown],
          [l, crown],
        ],
        "#d9c8a0",
        "#5a503c",
      );
      oval(ctx, x, crown, w * 0.68, body * 0.035, "#e1ceaa", "#5a503c");
      break;
    default:
      break;
  }
  const neck = y + body * 0.36,
    waist = y + body * 0.63;
  if (look.accessory === "scarf" || look.accessory === "sash") {
    const yy = look.accessory === "scarf" ? neck : waist;
    polygon(
      ctx,
      [
        [x - body * 0.19, yy - 2],
        [x + body * 0.19, yy - 2],
        [x + body * 0.18, yy + 4],
        [x - body * 0.18, yy + 4],
      ],
      "#274b92",
    );
    polygon(
      ctx,
      [
        [x + body * 0.1, yy + 2],
        [x + body * 0.18, yy + 3],
        [x + body * 0.22, yy + body * 0.12],
        [x + body * 0.12, yy + body * 0.095],
      ],
      "#426eb3",
    );
  } else if (look.accessory === "satchel") {
    ctx.strokeStyle = "#886443";
    ctx.lineWidth = body * 0.033;
    ctx.beginPath();
    ctx.moveTo(x - body * 0.15, neck);
    ctx.lineTo(x + body * 0.18, waist);
    ctx.stroke();
    polygon(
      ctx,
      [
        [x + body * 0.1, waist - 4],
        [x + body * 0.25, waist - 4],
        [x + body * 0.25, waist + body * 0.12],
        [x + body * 0.1, waist + body * 0.12],
      ],
      "#a47c4c",
      "#563c2e",
    );
  } else if (!rear && ["pin", "badge", "pendant"].includes(look.accessory)) {
    const px = look.accessory === "pendant" ? x : x - body * 0.14;
    oval(
      ctx,
      px,
      neck + body * 0.075,
      body * 0.036,
      body * 0.036,
      look.accessory === "pendant" ? "#6fd6d0" : "#e7bc5f",
      "#70552f",
    );
  } else if (!rear && look.accessory === "glasses") {
    const ey = y + body * 0.22;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        x + side * w * 0.18,
        ey,
        w * 0.145,
        body * 0.042,
        0,
        0,
        Math.PI * 2,
      );
      ctx.strokeStyle = "#392d34";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = "#392d34";
    ctx.fillRect(x - 3, ey - 1, 6, 2);
  } else if (look.accessory === "ribbon") {
    polygon(
      ctx,
      [
        [x, neck],
        [x - body * 0.1, neck - 4],
        [x - body * 0.1, neck + 5],
        [x, neck],
        [x + body * 0.1, neck - 4],
        [x + body * 0.1, neck + 5],
      ],
      "#ad5f80",
    );
  }
}

export function styledSpriteFrame(image, sheet, frame, look, direction = 0) {
  if (!look?.enabled || !sheet.cw || !sheet.ch || !sheet.bodyHeight)
    return null;
  if (
    look.top === "original" &&
    look.bottom === "original" &&
    look.hat === "original" &&
    look.accessory === "none" &&
    look.hair === "original" &&
    look.hairColor === "original"
  )
    return null;
  const owner = wardrobeOwner(sheet.id);
  if (!owner) return null;
  const key = [
    sheet.id,
    sheet.revision,
    frame.row,
    frame.column,
    direction,
    JSON.stringify(look),
  ].join("|");
  if (frames.has(key)) {
    const cached = frames.get(key);
    frames.delete(key);
    frames.set(key, cached);
    return cached;
  }
  const index = frame.row * sheet.columns + frame.column;
  const canvas = document.createElement("canvas");
  canvas.width = sheet.cw;
  canvas.height = sheet.ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(
      image,
      frame.column * sheet.cw,
      frame.row * sheet.ch,
      sheet.cw,
      sheet.ch,
      0,
      0,
      sheet.cw,
      sheet.ch,
    );
    const data = ctx.getImageData(0, 0, sheet.cw, sheet.ch),
      pixels = data.data;
    const body = sheet.bodyHeight,
      anchor = sheet.anchors?.[index] ?? sheet.cw / 2;
    const baseline = sheet.baselines?.[index] ?? sheet.footY;
    const headTop =
      sheet.headTops?.[index] ?? sheet.labelTop ?? baseline - body;
    const mounted = ["surf", "bike", "fish-surf", "ride"].includes(
      sheet.action,
    );
    const dress = ["mi-shell", "fallyn"].includes(owner);
    const rear = [3, 4, 5].includes(direction);
    const topColor = rgb(tops[look.top]?.color),
      bottomColor = rgb(bottoms[look.bottom]?.color);
    const hairColor = rgb(hairColors[look.hairColor]?.color);
    let hairCount = 0,
      hairSum = [0, 0, 0];
    for (
      let y = Math.max(0, Math.floor(headTop - body * 0.06));
      y < Math.min(sheet.ch, headTop + body * (mounted ? 0.77 : 1.02));
      y++
    ) {
      for (
        let x = Math.max(0, Math.floor(anchor - body * 0.34));
        x < Math.min(sheet.cw, anchor + body * 0.34);
        x++
      ) {
        const i = (y * sheet.cw + x) * 4;
        if (pixels[i + 3] < 160) continue;
        const r = pixels[i],
          g = pixels[i + 1],
          b = pixels[i + 2],
          rel = (y - headTop) / body;
        const hair =
          (rel < 0.32 ||
            (["mi-shell", "ezra", "fallyn"].includes(owner) &&
              rel < 0.58 &&
              Math.abs(x - anchor) > body * 0.15)) &&
          isHair(r, g, b, owner) &&
          (rel < 0.17 || (rear && rel < 0.3) || !isSkin(r, g, b));
        if (hair) {
          hairCount++;
          hairSum[0] += r;
          hairSum[1] += g;
          hairSum[2] += b;
          shadePixel(pixels, i, hairColor, "plain", y, body);
          continue;
        }
        // Skin, face, exposed legs, dark outlines, shoes and mounts are not
        // color-swapped. A dress's skirt is a separate lower-garment finish.
        const bareSkin =
          isSkin(r, g, b) &&
          (Math.max(r, g, b) > 175 ||
            Math.abs(x - anchor) > body * 0.2 ||
            (dress && rel > 0.76)) &&
          !(owner === "fitzgerald" && rel > 0.62);
        if (rel < 0.34 || bareSkin) continue;
        if (rel < 0.61)
          shadePixel(pixels, i, topColor, tops[look.top]?.detail, y, body);
        else if (rel < (dress ? 0.79 : 0.94) && (!mounted || rel < 0.76))
          shadePixel(
            pixels,
            i,
            bottomColor,
            bottoms[look.bottom]?.detail,
            y,
            body,
          );
      }
    }
    ctx.putImageData(data, 0, 0);
    const hairSample = hairCount
      ? `rgb(${hairSum.map((v) => Math.round(v / hairCount)).join(",")})`
      : "#62432f";
    headAccessories(
      ctx,
      look,
      { x: anchor, y: headTop, width: body * 0.42 },
      body,
      frame.flip ? (8 - direction) % 8 : direction,
      hairSample,
    );
    const styled = {
      image: canvas,
      sheet: {
        ...sheet,
        columns: 1,
        rows: 1,
        cycleFrames: 1,
        idleFrame: 0,
        anchors: [anchor],
        baselines: [baseline],
        fixedFrame: { row: 0, column: 0, flip: frame.flip },
      },
    };
    frames.set(key, styled);
    if (frames.size > maxFrames) frames.delete(frames.keys().next().value);
    return styled;
  } catch {
    return null;
  }
}
