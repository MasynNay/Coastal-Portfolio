import { beachOutline } from "./Coast";

// Keep the entire coast continuous, including underneath the pier. The renderer
// masks the exact wooden deck instead of dropping whole coast samples, which
// left rectangular gaps on either side of the wood at some tide positions.
const run = beachOutline.map((p, i) => {
  const before =
      beachOutline[(i + beachOutline.length - 1) % beachOutline.length],
    after = beachOutline[(i + 1) % beachOutline.length],
    dx = after.x - before.x,
    dz = after.z - before.z,
    length = Math.hypot(dx, dz) || 1;
  return { ...p, nx: -dz / length, nz: dx / length };
});
export const shoreRuns = [[...run, run[0]]];

// Distance inward from the fixed beach boundary. The gentle secondary ripple
// travels along the coast; it cannot detach the wash from the open ocean.
export function shoreReach(p, time) {
  const phase = p.x * 0.18 + p.z * 0.14;
  return (
    0.14 +
    (0.5 + Math.sin(time / 2400 + phase * 0.12) * 0.5) * 0.4 +
    Math.sin(time / 1100 + phase) * 0.025
  );
}

export function shorePoint(p, distance) {
  return { x: p.x + p.nx * distance, z: p.z + p.nz * distance };
}
