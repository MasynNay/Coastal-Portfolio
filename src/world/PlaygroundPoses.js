import { spriteFrame } from "./animation";

// Reach-and-pull poses reuse the selected person's own face, hair, clothes and
// proportions. Limb cuts are from that costume's source cell, never recolored
// stock limbs. This renderer is used only on the net and at its summit.
export function drawClimber(ctx, img, sheet, point, height, pose) {
  if (!img || !sheet) return false;
  const frame = spriteFrame(sheet, pose.celebrating ? 0 : 4, false, 0),
    index = frame.row * sheet.columns + frame.column,
    body = sheet.bodyHeight || 96,
    foot = sheet.baselines?.[index] ?? sheet.footY,
    center = sheet.anchors?.[index] ?? sheet.cw / 2,
    top = foot - body,
    scale = height / body,
    sx = frame.column * sheet.cw,
    sy = frame.row * sheet.ch,
    cycle = pose.poseTime / 700,
    reach = (side) =>
      0.5 + 0.5 * Math.sin(cycle * Math.PI * 2 + (side < 0 ? 0 : Math.PI)),
    cheer = pose.celebrating
      ? Math.min(1, Math.max(0, (pose.poseTime - 5050) / 300))
      : 0;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(
    point.x,
    point.y -
      (pose.celebrating
        ? Math.max(0, Math.sin((pose.poseTime - 5050) / 280)) * height * 0.035
        : 0),
  );
  ctx.scale(frame.flip ? -scale : scale, scale);
  ctx.translate(-center, -foot);
  // Work in the source cell's coordinates; hands and feet stay attached to the
  // same shoulders/hips while alternate hands reach for the next rope junction.
  const part = (x, y, w, h, px, py, angle = 0) => {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.drawImage(img, sx + x, sy + y, w, h, x - px, y - py, w, h);
    ctx.restore();
  };
  const shoulderY = top + body * 0.43,
    hipY = top + body * 0.76,
    leftX = center - body * 0.23,
    rightX = center + body * 0.11,
    armW = body * 0.14,
    armH = body * 0.34;
  // Legs bend out from the hips instead of cycling through a walking atlas.
  for (const side of [-1, 1]) {
    const x = center + (side < 0 ? -body * 0.13 : 0);
    part(
      x,
      hipY,
      body * 0.14,
      body * 0.25,
      center + side * body * 0.075,
      hipY,
      pose.celebrating ? 0 : -side * (0.18 + reach(side) * 0.4),
    );
  }
  for (const side of [-1, 1]) {
    const x = side < 0 ? leftX : rightX,
      turn =
        -side * (pose.celebrating ? 2.45 * cheer : 1.15 + reach(side) * 1.25);
    part(
      x,
      shoulderY,
      armW,
      armH,
      center + side * body * 0.145,
      shoulderY,
      turn,
    );
  }
  // Draw head/hair last so the neck and raised shoulders cannot leave gaps.
  ctx.drawImage(
    img,
    sx + center - body * 0.14,
    sy + top + body * 0.38,
    body * 0.28,
    body * 0.4,
    center - body * 0.14,
    top + body * 0.38,
    body * 0.28,
    body * 0.4,
  );
  ctx.drawImage(
    img,
    sx + center - body * 0.28,
    sy + top,
    body * 0.56,
    body * 0.43,
    center - body * 0.28,
    top,
    body * 0.56,
    body * 0.43,
  );
  ctx.restore();
  if (pose.celebrating) {
    ctx.save();
    ctx.fillStyle = "#ffe3a2";
    ctx.font = `${Math.max(14, height * 0.2)}px system-ui`;
    ctx.textAlign = "center";
    for (let i = 0; i < 3; i++)
      ctx.fillText(
        "✦",
        point.x + (i - 1) * height * 0.34,
        point.y - height * (1.15 + Math.sin(pose.poseTime / 250 + i) * 0.04),
      );
    ctx.restore();
  }
  return true;
}
