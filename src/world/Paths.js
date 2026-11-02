import { canStand } from "./navigation";

// Shared route finishing for residents and guided rides. Checks use small world
// steps so shortening a grid path never clips a prop or a corner of the fence.
export function clearLine(a, b, blockers, inside = false, surfing = false) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.12);
  for (let i = 1; i <= steps; i++)
    if (
      !canStand(
        a.x + ((b.x - a.x) * i) / steps,
        a.z + ((b.z - a.z) * i) / steps,
        blockers,
        inside,
        surfing,
      )
    )
      return false;
  return true;
}
export function smoothPath(
  start,
  path,
  blockers,
  inside = false,
  surfing = false,
) {
  const result = [];
  let anchor = start,
    index = 0;
  while (index < path.length) {
    let next = index;
    for (let i = path.length - 1; i > index; i--)
      if (clearLine(anchor, path[i], blockers, inside, surfing)) {
        next = i;
        break;
      }
    result.push(path[next]);
    anchor = path[next];
    index = next + 1;
  }
  return result;
}
// Round a turn only when the whole curve is clear. Tight spaces keep a smaller
// turn rather than letting interpolation cut through an obstacle.
export function roundPath(points, blockers) {
  // Route legs can share an identical endpoint. Remove it before measuring
  // corners; otherwise both copies are skipped and a whole loop can collapse.
  points = points.filter(
    (p, i, list) =>
      !i || Math.hypot(p.x - list[i - 1].x, p.z - list[i - 1].z) > 0.0001,
  );
  if (points.length < 3) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1];
    const before = Math.hypot(a.x - b.x, a.z - b.z),
      after = Math.hypot(c.x - b.x, c.z - b.z);
    if (!before || !after) continue;
    let cut = Math.min(1.2, before * 0.3, after * 0.3),
      curve = null;
    while (cut > 0.06) {
      const start = {
        x: b.x + ((a.x - b.x) * cut) / before,
        z: b.z + ((a.z - b.z) * cut) / before,
      };
      const end = {
        x: b.x + ((c.x - b.x) * cut) / after,
        z: b.z + ((c.z - b.z) * cut) / after,
      };
      const arc = Array.from({ length: 17 }, (_, n) => {
        const t = n / 16,
          u = 1 - t;
        return {
          x: u * u * start.x + 2 * u * t * b.x + t * t * end.x,
          z: u * u * start.z + 2 * u * t * b.z + t * t * end.z,
        };
      });
      if (arc.every((p) => canStand(p.x, p.z, blockers))) {
        curve = arc;
        break;
      }
      cut /= 2;
    }
    result.push(...(curve || [b]));
  }
  result.push(points[points.length - 1]);
  return result.filter(
    (p, i, list) =>
      !i || Math.hypot(p.x - list[i - 1].x, p.z - list[i - 1].z) > 0.0001,
  );
}
