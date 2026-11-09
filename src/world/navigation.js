import { oceanBounds } from "./Coast";
import { isOcean } from "./TownLayout";
import { onRoomFloor } from "./WorldLayout";
import { parkedCraftBlocks } from "./Harbor";
// Pure movement rules used by keyboard movement and click-to-walk; no renderer or React state here.
export function canStand(x, z, obstacles, inside = false, surfing = false) {
  if (!inside && parkedCraftBlocks(x, z)) return false;
  if (inside && !onRoomFloor(inside, x, z)) return false;
  if (
    !inside &&
    (x < oceanBounds.left ||
      x > oceanBounds.right ||
      z < oceanBounds.back ||
      z > oceanBounds.front ||
      (isOcean(x, z) && !surfing))
  )
    return false;
  return !obstacles.some((o) =>
    o.water && surfing
      ? false
      : o.door && Math.abs(x - o.x) < o.door.width / 2 && z > o.z + o.door.back
        ? false
        : o.rx
          ? ((x - o.x) / (o.rx + (o.water ? 0 : 0.45))) ** 2 +
              ((z - o.z) / (o.rz + (o.water ? 0 : 0.45))) ** 2 <
            1
          : o.radius
            ? Math.hypot(x - o.x, z - o.z) < o.radius + 0.45
            : Math.abs(x - o.x) < o.w / 2 + (o.clearance ?? 0.4) &&
              Math.abs(z - o.z) < o.d / 2 + (o.clearance ?? 0.4),
  );
}
export function move(position, dx, dz, obstacles, inside, surfing = false) {
  // Separate axes allow natural sliding along a wall without entering a building.
  const next = {
    ...position,
  };
  // Late frames still cover elapsed time; small collision substeps prevent wall tunneling.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.2));
  for (let i = 0; i < steps; i++) {
    if (canStand(next.x + dx / steps, next.z, obstacles, inside, surfing))
      next.x += dx / steps;
    if (canStand(next.x, next.z + dz / steps, obstacles, inside, surfing))
      next.z += dz / steps;
  }
  return next;
}
export function findPath(
  start,
  target,
  obstacles,
  inside = false,
  surfing = false,
) {
  // Bounded A* avoids straight-line walking through houses. Diagonals cannot cut corners.
  const snap = (p) => ({
    x: Math.round(p.x),
    z: Math.round(p.z),
  });
  const a = snap(start),
    b = snap(target),
    key = (p) => `${p.x},${p.z}`;
  if (!canStand(b.x, b.z, obstacles, inside, surfing)) return [];
  const open = [
      {
        ...a,
        g: 0,
        f: 0,
      },
    ],
    costs = new Map([[key(a), 0]]),
    parents = new Map();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (let count = 0; open.length && count < 5000; count++) {
    open.sort((p, q) => p.f - q.f);
    const current = open.shift();
    if (key(current) === key(b)) {
      const path = [];
      let p = b;
      while (key(p) !== key(a)) {
        path.unshift({
          x: p.x,
          z: p.z,
        });
        p = parents.get(key(p));
        if (!p) return [];
      }
      return path;
    }
    for (const [dx, dz] of dirs) {
      const p = {
        x: current.x + dx,
        z: current.z + dz,
      };
      if (
        !canStand(p.x, p.z, obstacles, inside, surfing) ||
        !canStand(current.x + dx, current.z, obstacles, inside, surfing) ||
        !canStand(current.x, current.z + dz, obstacles, inside, surfing)
      )
        continue;
      const g = current.g + Math.hypot(dx, dz);
      if (g >= (costs.get(key(p)) ?? Infinity)) continue;
      costs.set(key(p), g);
      parents.set(key(p), current);
      open.push({
        ...p,
        g,
        f: g + Math.hypot(b.x - p.x, b.z - p.z),
      });
    }
  }
  return [];
}
