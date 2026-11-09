import eelArt from "./EelArt.json";

const eelWidth = 88;
const eelLength = 410;
const headLength = 123;
const neckStart = 102;
const jawFrames = [0, 1, 2, 1];

// Assemble the original painted parts once. The neck fades into the aligned
// body over a few pixels, so the join has neither a line nor stretched scales.
export function prepareEelFrames(heads, body) {
  const { cw, columns } = eelArt.heads;
  const bodyHeight = eelArt.body.height;
  const head = document.createElement("canvas");
  head.width = eelWidth;
  head.height = headLength;
  const mask = head.getContext("2d");

  return Array.from({ length: columns }, (_, column) => {
    const eel = document.createElement("canvas");
    eel.width = eelWidth;
    eel.height = eelLength;
    const ctx = eel.getContext("2d");
    const neckX = column === 2 ? 22 : 20;
    for (let y = neckStart, tile = 0; y < eelLength; y += bodyHeight, tile++) {
      ctx.save();
      ctx.translate(neckX, y + (tile % 2 ? bodyHeight : 0));
      if (tile % 2) ctx.scale(1, -1);
      ctx.drawImage(body, 11, 0, 53, bodyHeight, 0, 0, 52, bodyHeight);
      ctx.restore();
    }

    mask.clearRect(0, 0, eelWidth, headLength);
    mask.drawImage(
      heads,
      column * cw,
      4,
      cw,
      headLength,
      -20,
      0,
      cw,
      headLength,
    );
    mask.save();
    mask.globalCompositeOperation = "destination-in";
    const blend = mask.createLinearGradient(0, 112, 0, headLength);
    blend.addColorStop(0, "#fff");
    blend.addColorStop(1, "#fff0");
    mask.fillStyle = blend;
    mask.fillRect(0, 0, eelWidth, headLength);
    mask.restore();
    ctx.drawImage(head, 0, 0);
    return eel;
  });
}

// Both obstacles use the exact same crop and jaw animation. Flipping only
// the vertical axis keeps the upper and lower mouths on their collision edges.
export function drawEelGate(ctx, frames, x, tip, width, length, upper, time) {
  if (!frames || length <= 0) return;
  const image = frames[jawFrames[Math.floor(time / 165) % jawFrames.length]];
  const sourceHeight = (length * eelWidth) / width;
  ctx.save();
  ctx.translate(x + width / 2, tip);
  if (upper) ctx.scale(1, -1);
  ctx.drawImage(
    image,
    0,
    0,
    eelWidth,
    sourceHeight,
    -width / 2,
    0,
    width,
    length,
  );
  ctx.restore();
}
