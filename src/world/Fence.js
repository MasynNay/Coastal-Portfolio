// The low white harbor railing follows the shared island boundary. Native canvas
// rails join at corners with upright capped posts; nothing crosses the pier gap.
export const fenceRuns = [
  [-28, -29, 28, -29],
  [-28, -29, -28, 19.6],
  [28, -29, 28, 19.6],
  [-28, 19.6, -3.5, 19.6],
  [3.5, 19.6, 28, 19.6],
];
// Collision follows the exact rail roots used by the artwork, with enough room
// for a person's body. These stay solid even while mounted on an axolotl.
export const fenceObstacles = fenceRuns.map(([x1, z1, x2, z2]) => ({
  x: (x1 + x2) / 2,
  z: (z1 + z2) / 2,
  w: Math.abs(x2 - x1) + 0.18,
  d: Math.abs(z2 - z1) + 0.18,
  clearance: 0.55,
}));
// Surf mounting is a short move, not a teleport through a wall. Segment/slab
// intersection prevents hopping over a thin rail when the destination is clear.
export function fenceBlocksTravel(from, to) {
  return fenceObstacles.some((o) => {
    let entry = 0,
      exit = 1;
    for (const [axis, span] of [
      ["x", o.w],
      ["z", o.d],
    ]) {
      const delta = to[axis] - from[axis];
      const low = o[axis] - span / 2 - o.clearance;
      const high = o[axis] + span / 2 + o.clearance;
      if (Math.abs(delta) < 1e-9) {
        if (from[axis] < low || from[axis] > high) return false;
      } else {
        const a = (low - from[axis]) / delta,
          b = (high - from[axis]) / delta;
        entry = Math.max(entry, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
        if (entry > exit) return false;
      }
    }
    return true;
  });
}
export function drawFence(ctx, at, unit) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [x1, z1, x2, z2] of fenceRuns) {
    const length = Math.hypot(x2 - x1, z2 - z1),
      count = Math.ceil(length / 2.15);
    const points = Array.from(
      {
        length: count + 1,
      },
      (_, i) => at(x1 + ((x2 - x1) * i) / count, z1 + ((z2 - z1) * i) / count),
    );
    for (const level of [0.4, 0.83]) {
      for (const [color, stroke, offset] of [
        ["#587b85", 0.12, 0.025],
        ["#dce8e4", 0.09, 0],
        ["#fff7df", 0.025, -0.035],
      ]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, unit * stroke);
        ctx.beginPath();
        points.forEach((p, i) => {
          const y = p.y - (level - offset) * unit;
          i ? ctx.lineTo(p.x, y) : ctx.moveTo(p.x, y);
        });
        ctx.stroke();
      }
    }
    for (const p of points) {
      const w = Math.max(2, unit * 0.14),
        h = unit * 1.08;
      ctx.fillStyle = "#587882";
      ctx.fillRect(p.x - w / 2 + 1, p.y - h, w, h);
      ctx.fillStyle = "#e7efdf";
      ctx.fillRect(p.x - w / 2, p.y - h, w * 0.7, h);
      ctx.fillStyle = "#fcf7e7";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - h, w * 0.8, w * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8ca6a1";
      ctx.fillRect(p.x - w / 2, p.y - h * 0.74, w, Math.max(1, unit * 0.025));
    }
  }
  ctx.restore();
}
