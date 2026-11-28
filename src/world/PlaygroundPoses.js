import { spriteFrame } from "./animation";

// Use complete illustrated cells for climbing instead of rotating overlapping
// rectangles of the standing sprite. Bent knees and extended arms keep the
// selected costume's hands, hair and boots intact while traversing the net.
export function climbingFrame(pose) {
  if (pose.celebrating) {
    const t = Math.max(0, Math.min(1, (pose.poseTime - 5050) / 350));
    return { direction: 0, column: Math.round(3 + t * 3) };
  }
  const step = (pose.poseTime / 700) % 1;
  const sequence = [4, 5, 6, 7, 8, 9, 8, 5];
  return {
    direction: pose.stage === "climbing" ? 3 : 4,
    column: sequence[Math.floor(step * sequence.length)],
  };
}

export function drawClimber(ctx, img, sheet, point, height, pose) {
  if (!img || !sheet || sheet.action !== "board-trick") return false;
  const { direction, column } = climbingFrame(pose);
  const frame = spriteFrame(
    sheet,
    direction,
    true,
    column * sheet.frameMs + 0.1,
  );
  const index = frame.row * sheet.columns + frame.column;
  const body = sheet.bodyHeight || 96;
  const foot = sheet.baselines?.[index] ?? sheet.footY;
  const center = sheet.anchors?.[index] ?? sheet.cw / 2;
  const scale = height / body;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(point.x, point.y);
  ctx.scale(frame.flip ? -scale : scale, scale);
  ctx.drawImage(
    img,
    frame.column * sheet.cw,
    frame.row * sheet.ch,
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
