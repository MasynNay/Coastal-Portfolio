// The floor and approaching objects share one perspective camera. World-space
// texture coordinates advance with distance, so the runner travels over the
// paving instead of jogging against a stationary photograph.
export const runnerCamera = { horizon: 220, feet: 620, near: 10, center: 300 };
export function projectRunner(lane, ahead = 0) {
  const { horizon, feet, near, center } = runnerCamera,
    scale = near / Math.max(near * 0.6, ahead + near);
  return {
    x: center + (lane - 1) * 176 * scale,
    y: horizon + scale * (feet - horizon),
    scale,
  };
}
// Downsampled copies are made once per decoded texture, never during a frame.
// Far paving uses a blurred mip level, preventing fine grout from shimmering.
const floorTextures = new WeakMap();
function textureLevels(image) {
  if (floorTextures.has(image)) return floorTextures.get(image);
  const levels = [];
  for (let size = 512; size >= 8; size /= 2) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(0, size);
    ctx.scale(1, -1);
    ctx.drawImage(image, 0, 0, size, size);
    levels.push(canvas);
  }
  floorTextures.set(image, levels);
  return levels;
}
export function drawRunnerTrack(ctx, image, distance) {
  if (!image) return;
  const { center, horizon, feet, near } = runnerCamera,
    levels = textureLevels(image),
    height = feet - horizon,
    bottom = 700,
    tileMeters = 18,
    roadHalfWidth = 340;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center, horizon);
  ctx.lineTo(center + (roadHalfWidth * (bottom - horizon)) / height, bottom);
  ctx.lineTo(center - (roadHalfWidth * (bottom - horizon)) / height, bottom);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "#536668";
  ctx.fillRect(0, horizon + 28, 600, bottom - horizon);
  // Whole-pixel horizontal strips sample the same continuous floor. Using the
  // simulation distance (rather than wall-clock time) also freezes it on pause.
  ctx.imageSmoothingEnabled = true;
  for (let y = horizon + 30; y < bottom; ) {
    const strip = Math.min(y < 480 ? 5 : 3, bottom - y);
    const q = (y - horizon) / height,
      nextQ = (y + strip - horizon) / height,
      worldZ = near / q - near,
      span = near / q - near / nextQ,
      pixelsPerStrip = (span / tileMeters) * 512,
      level = Math.max(
        0,
        Math.min(
          levels.length - 1,
          Math.floor(Math.log2(Math.max(1, pixelsPerStrip / 2))),
        ),
      ),
      tile = levels[level],
      sourceSpan = (span / tileMeters) * tile.height,
      phase = ((((worldZ + distance) / tileMeters) % 1) + 1) % 1,
      sourceY = (1 - phase) * tile.height,
      halfWidth = roadHalfWidth * nextQ;
    // Blend into the painted horizon; no hard seam or high-frequency detail at
    // the vanishing point. The near slabs remain large and readable.
    ctx.globalAlpha = Math.min(1, Math.max(0, (q - 0.07) / 0.15));
    const first = Math.min(sourceSpan, tile.height - sourceY),
      firstHeight = (strip * first) / sourceSpan;
    if (first > 0)
      ctx.drawImage(
        tile,
        0,
        sourceY,
        tile.width,
        first,
        center - halfWidth,
        y,
        halfWidth * 2,
        firstHeight,
      );
    if (first < sourceSpan)
      ctx.drawImage(
        tile,
        0,
        0,
        tile.width,
        sourceSpan - first,
        center - halfWidth,
        y + firstHeight,
        halfWidth * 2,
        strip - firstHeight,
      );
    y += strip;
  }
  // Quiet lane dividers sit on the same perspective plane as the hazards.
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = "#c7ece0";
  ctx.lineWidth = 1.5;
  for (const lane of [0.5, 1.5]) {
    const far = projectRunner(lane, 60);
    const nearEdge = projectRunner(lane, -1.7);
    ctx.beginPath();
    ctx.moveTo(far.x, far.y);
    ctx.lineTo(nearEdge.x, nearEdge.y);
    ctx.stroke();
  }
  ctx.restore();
}
// Gold, a bright rim and a recognizable coin silhouette distinguish rewards
// from the cool stone hazards. This vector icon remains crisp on small phones.
export function drawRunnerCoin(ctx, x, y, scale, time, id) {
  const radius = 34 * scale,
    spin = 0.72 + Math.sin(time / 360 + id) * 0.28;
  ctx.save();
  ctx.translate(x, y - 36 * scale + Math.sin(time / 260 + id) * 3 * scale);
  const halo = ctx.createRadialGradient(
    0,
    0,
    radius * 0.3,
    0,
    0,
    radius * 1.65,
  );
  halo.addColorStop(0, "#ffdf8b88");
  halo.addColorStop(1, "#ffe48500");
  ctx.fillStyle = halo;
  ctx.fillRect(-radius * 1.7, -radius * 1.7, radius * 3.4, radius * 3.4);
  ctx.scale(spin, 1);
  const gold = ctx.createLinearGradient(-radius, -radius, radius, radius);
  gold.addColorStop(0, "#fff7bd");
  gold.addColorStop(0.35, "#ffe36b");
  gold.addColorStop(1, "#e9a42d");
  ctx.fillStyle = gold;
  ctx.strokeStyle = "#71411d";
  ctx.lineWidth = 3.5 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#fff4b5";
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  // A small embossed air spiral ties the reward into the Air Temple theme.
  ctx.strokeStyle = "#966024";
  ctx.lineWidth = 3.7 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 3.7,
      r = (i / 48) * radius * 0.56,
      px = Math.cos(a) * r,
      py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}
