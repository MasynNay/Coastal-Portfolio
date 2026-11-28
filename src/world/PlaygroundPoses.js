import { styledSpriteFrame } from "./WardrobePainter";

// Dedicated complete-body climbing drawings: four alternating grips and two
// front-facing summit cheers. The movement clock is tied to the actual rungs.
export function climbingFrame(pose) {
  if (pose.celebrating) {
    return { direction: 0, column: (pose.celebrateTime ?? 0) < 280 ? 4 : 5 };
  }
  const cycle = pose.climbCycle ?? (pose.poseTime / 1400) % 1;
  return { direction: 4, column: Math.min(3, Math.floor(cycle * 4)) };
}

export function drawClimber(
  ctx,
  img,
  sheet,
  point,
  height,
  pose,
  customLook = null,
) {
  if (!img || !sheet || sheet.action !== "climb") return false;
  const { column } = climbingFrame(pose);
  const index = column;
  const styled =
    customLook &&
    styledSpriteFrame(
      img,
      sheet,
      { row: 0, column, flip: false },
      customLook,
      pose.celebrating ? 0 : 4,
    );
  const body = sheet.bodyHeight || 96;
  const foot = sheet.baselines?.[index] ?? sheet.footY;
  const center = sheet.anchors?.[index] ?? sheet.cw / 2;
  const scale = height / body;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(point.x, point.y);
  ctx.scale(scale, scale);
  ctx.drawImage(
    styled?.image || img,
    (styled ? 0 : column) * sheet.cw,
    0,
    sheet.cw,
    sheet.ch,
    -center,
    -foot,
    sheet.cw,
    sheet.ch,
  );
  ctx.restore();
  return true;
}
