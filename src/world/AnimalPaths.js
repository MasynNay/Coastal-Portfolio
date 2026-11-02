import { findPath } from "./navigation";
import { obstacles } from "./config";
import { movementDirection } from "./animation";
export const pathDistance = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);
// Pet activities share one collision-aware route sampler. Water is opt-in;
// walking players cannot inherit a duck's permission to cross the pond.
export function animalPath(from, to, water = false) {
  const route = findPath(from, to, obstacles, false, water);
  if (!route.length && pathDistance(from, to) > 0.3) return null;
  return [
    {
      x: from.x,
      z: from.z,
    },
    ...route,
    {
      x: to.x,
      z: to.z,
    },
  ];
}
export function pathLength(points) {
  return points
    .slice(1)
    .reduce((sum, p, i) => sum + pathDistance(points[i], p), 0);
}
export function sampleAnimalPath(points, progress) {
  let remaining = Math.max(0, Math.min(1, progress)) * pathLength(points);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      d = pathDistance(a, b);
    if (remaining <= d && d) {
      const t = remaining / d;
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        direction: movementDirection(b.x - a.x, b.z - a.z),
      };
    }
    remaining -= d;
  }
  return {
    ...points.at(-1),
    direction: 0,
  };
}
