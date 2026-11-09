export const groveTree = { x: -24, z: -23 };
export const groveInteraction = {
  id: "totoro-grove",
  type: "grove",
  label: "Dance with Totoro",
  x: -25.5,
  z: -21.1,
};
export const groveSpirit = { art: "totoro-grove", x: -26, z: -22.35, h: 2.5 };
const danceDuration = 5600;

export function groveDance(started, time) {
  const elapsed = time - started;
  if (started === null || elapsed >= danceDuration) return null;
  // A short build-up, a held growth pose, and a gentle return to the same tree.
  const blend = Math.min(1, elapsed / 1700, (danceDuration - elapsed) / 1200);
  const growth = blend * blend * (3 - 2 * blend);
  return {
    elapsed,
    growth,
    bounce: Math.max(0, Math.sin(elapsed / 145)) * 0.16,
  };
}

export function drawGroveLights(ctx, at, unit, dance) {
  if (!dance) return;
  const tree = at(groveTree.x, groveTree.z);
  ctx.save();
  ctx.fillStyle = "#f9e6a0";
  for (let i = 0; i < 16; i++) {
    const height =
      ((dance.elapsed / 840 + i * 0.39) % 1) * (3 + dance.growth * 3);
    const angle = i * 2.4 + dance.elapsed / 900;
    ctx.globalAlpha =
      dance.growth * (0.4 + 0.5 * Math.sin((height / 6) * Math.PI));
    ctx.beginPath();
    ctx.arc(
      tree.x + Math.cos(angle) * unit * (1.4 + height * 0.12),
      tree.y - height * unit,
      unit * 0.045,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}
