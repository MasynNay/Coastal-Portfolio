import { coinDrawTime } from "./Runner";

let coinImage;
function getCoin() {
  if (coinImage) return coinImage;
  coinImage = document.createElement("canvas");
  coinImage.width = coinImage.height = 96;
  const ctx = coinImage.getContext("2d");
  ctx.translate(48, 48);
  const gold = ctx.createLinearGradient(-24, -31, 24, 31);
  gold.addColorStop(0, "#fff7bd");
  gold.addColorStop(0.4, "#ffdb56");
  gold.addColorStop(1, "#dd8d28");
  ctx.fillStyle = gold;
  ctx.strokeStyle = "#6b401d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 33, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#fff4b5";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 27, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#966024";
  ctx.lineWidth = 3.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * Math.PI * 3.7,
      r = (i / 36) * 18;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.stroke();
  return coinImage;
}

function drawCoin(ctx, x, y, scale, time, id) {
  const size = 96 * scale,
    spin = 0.78 + Math.sin(time / 240 + id) * 0.22;
  ctx.drawImage(
    getCoin(),
    x - (size * spin) / 2,
    y - size / 2,
    size * spin,
    size,
  );
}

export function drawTrackCoin(ctx, object, view, state) {
  const p = view(object.lane, object.at - state.distance);
  const time = state.elapsed * 1000;
  drawCoin(
    ctx,
    p.x,
    p.y - (36 - Math.sin(time / 260 + object.id) * 3) * p.scale,
    p.scale,
    time,
    object.id,
  );
}

// A foreground layer keeps the coin above obstacles, auras and the rider.
// Its arc ends at the shoulder, where a gold flash confirms the score.
export function drawMagnetCoin(ctx, object, view, rider, feet, elapsed) {
  const origin = view(object.lane, object.drawnAhead);
  const t = Math.min(1, (elapsed - object.drawnAt) / coinDrawTime);
  const ease = t * t * (3 - 2 * t);
  const side =
    object.lane === 1 ? (object.id % 2 ? 1 : -1) : Math.sign(object.lane - 1);
  const endX = rider.x + side * 42;
  const endY = feet - 98;
  const lift = 48 * Math.sin(t * Math.PI);
  const x = origin.x + (endX - origin.x) * ease;
  const startY = origin.y - 36 * origin.scale;
  const y = startY + (endY - startY) * ease - lift;
  const scale =
    Math.max(origin.scale, 0.55) + 0.16 * Math.sin((t * Math.PI) / 2);
  ctx.save();
  ctx.strokeStyle = "#9ff4ffe6";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(
    x - (endX - origin.x) * 0.19,
    y + 12,
    x - (endX - origin.x) * 0.31,
    y + 21 + lift * 0.37,
  );
  ctx.stroke();
  ctx.fillStyle = "#75dbe64d";
  ctx.beginPath();
  ctx.arc(x, y, 39 * scale, 0, Math.PI * 2);
  ctx.fill();
  drawCoin(ctx, x, y, scale, elapsed * 1000, object.id);
  ctx.restore();
}
