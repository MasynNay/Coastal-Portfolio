import { fishingPull } from "./Fishing";

// The person comes from their real fishing sheet. Rod/line placement is projected
// toward an actual water point, so a north-facing cast cannot leave its bobber on grass.
export function drawFishingLine(
  ctx,
  at,
  unit,
  position,
  target,
  elapsed,
  phase,
  mounted = false,
  bodyHeight = 2.25,
  illustratedTip = null,
) {
  if (!target) return;
  const p = at(position.x, position.z),
    water = at(target.x, target.z);
  const t = Math.min(1, elapsed / 680);
  const dx = water.x - p.x;
  const pull = fishingPull(elapsed, phase);
  const hand = {
    x:
      p.x +
      (Math.abs(dx) < unit * 0.1 ? 1 : Math.sign(dx)) * bodyHeight * 0.2 * unit,
    y: p.y - bodyHeight * (mounted ? 0.5 : 0.52) * unit,
  };
  const tip = illustratedTip || {
    x: hand.x + (water.x - p.x) * (0.55 - pull * 0.19) * t,
    y:
      hand.y -
      1.1 * unit * (1 - t) +
      (water.y - hand.y) * 0.55 * t -
      (0.4 + pull * 0.65) * unit,
  };
  const bob = {
    x: hand.x + (water.x - hand.x) * t * (1 - pull * 0.22),
    y:
      hand.y +
      (water.y - hand.y) * t -
      (Math.sin(t * Math.PI) * 0.8 + pull * 0.26) * unit,
  };
  ctx.save();
  ctx.strokeStyle = "#70452b";
  ctx.lineWidth = Math.max(2, unit * 0.055);
  ctx.lineCap = "round";
  if (!illustratedTip) {
    ctx.beginPath();
    ctx.moveTo(hand.x, hand.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#ebefd9cc";
  ctx.lineWidth = Math.max(1, unit * 0.02);
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.quadraticCurveTo(bob.x, tip.y + (0.3 - pull * 0.14) * unit, bob.x, bob.y);
  ctx.stroke();
  const bounce =
    phase === "bite"
      ? Math.sin(elapsed / 40) * unit * 0.08
      : Math.sin(elapsed / 250) * unit * 0.015;
  ctx.fillStyle = "#f0e7bd";
  ctx.beginPath();
  ctx.ellipse(
    bob.x,
    bob.y + bounce,
    unit * 0.075,
    unit * 0.045,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = "#cf6b48";
  ctx.beginPath();
  ctx.arc(bob.x, bob.y + bounce - unit * 0.025, unit * 0.045, 0, Math.PI * 2);
  ctx.fill();
  if (t === 1) {
    ctx.strokeStyle = "#e2f2dc77";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      bob.x,
      bob.y,
      unit * (0.18 + (elapsed % 900) / 4500),
      unit * 0.07,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.restore();
}
