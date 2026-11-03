import { isOcean } from "./TownLayout";

// Shared berth positions drive artwork, interaction prompts and solid hulls.
// Boarding points are on the pier; visitors do not have to swim to rent a craft.
export const watercraft = [
  {
    id: "boat",
    name: "Island boat",
    art: "harbor-boat",
    x: -5,
    z: 27,
    boardX: -2.25,
    boardZ: 27,
    h: 3.2,
    speed: 16,
  },
  {
    id: "jetski",
    name: "Jet ski",
    art: "harbor-jetski",
    x: 5,
    z: 27,
    boardX: 2.25,
    boardZ: 27,
    h: 2.1,
    speed: 17,
  },
];
export function parkedCraftBlocks(x, z) {
  return watercraft.some((c) => Math.hypot(x - c.x, z - (c.z - 0.7)) < 1.35);
}
export function craftWater(x, z, ignore) {
  if (Math.abs(x) > 43 || z < -39 || z > 40) return false;
  // Check the hull footprint, not just its center, against the island and pier.
  if (
    ![
      [0, 0],
      [1.1, 0],
      [-1.1, 0],
      [0, 1.1],
      [0, -1.1],
    ].every(([dx, dz]) => isOcean(x + dx, z + dz))
  )
    return false;
  return !watercraft.some(
    (c) => c.id !== ignore && Math.hypot(x - c.x, z - c.z) < 2.4,
  );
}
export const islandLap = [
  { x: -5, z: 27 },
  { x: -9, z: 31 },
  { x: -30, z: 33 },
  { x: -36, z: 25 },
  { x: -36, z: -29 },
  { x: -36, z: -36 },
  { x: 36, z: -36 },
  { x: 36, z: -29 },
  { x: 36, z: 25 },
  { x: 30, z: 34 },
  { x: 8, z: 35 },
  { x: -5, z: 35 },
  { x: -5, z: 27 },
];
const blend = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  z: a.z + (b.z - a.z) * t,
});
export function clearWaterLine(a, b, id) {
  const count = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1);
  for (let i = 0; i <= count; i++) {
    const p = blend(a, b, i / (count || 1));
    if (!craftWater(p.x, p.z, id)) return false;
  }
  return true;
}
// A tiny visibility graph avoids planning through land when returning from
// the far side of the island. Routes are created once, never every frame.
export function oceanRoute(start, end, id) {
  const nodes = [
    start,
    end,
    ...islandLap.slice(1, -1),
    { x: 5, z: 35 },
    { x: 5, z: 27 },
  ];
  const distance = nodes.map(() => Infinity),
    previous = [],
    done = new Set();
  distance[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let next = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!done.has(i) && (next < 0 || distance[i] < distance[next])) next = i;
    if (next < 0 || !Number.isFinite(distance[next])) return null;
    if (next === 1) {
      const path = [];
      for (let i = 1; i !== undefined; i = previous[i]) path.unshift(nodes[i]);
      return path;
    }
    done.add(next);
    for (let i = 0; i < nodes.length; i++)
      if (!done.has(i) && clearWaterLine(nodes[next], nodes[i], id)) {
        const cost =
          distance[next] +
          Math.hypot(nodes[next].x - nodes[i].x, nodes[next].z - nodes[i].z);
        if (cost < distance[i]) {
          distance[i] = cost;
          previous[i] = next;
        }
      }
  }
  return null;
}
export function waterRoute(points, id) {
  const rounded = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1],
      ab = Math.hypot(b.x - a.x, b.z - a.z),
      bc = Math.hypot(c.x - b.x, c.z - b.z);
    const entry = blend(b, a, Math.min(3, ab / 3) / (ab || 1)),
      exit = blend(b, c, Math.min(3, bc / 3) / (bc || 1));
    const curve = Array.from({ length: 9 }, (_, k) => {
      const t = k / 8;
      return blend(blend(entry, b, t), blend(b, exit, t), t);
    });
    if (
      curve.every(
        (p, i) =>
          craftWater(p.x, p.z, id) &&
          (!i || clearWaterLine(curve[i - 1], p, id)),
      )
    )
      rounded.push(...curve);
    else rounded.push(b);
  }
  rounded.push(points[points.length - 1]);
  const distances = [0];
  for (let i = 1; i < rounded.length; i++)
    distances.push(
      distances[i - 1] +
        Math.hypot(
          rounded[i].x - rounded[i - 1].x,
          rounded[i].z - rounded[i - 1].z,
        ),
    );
  return {
    points: rounded,
    distances,
    length: distances[distances.length - 1],
  };
}
export function sampleWaterRoute(route, distance) {
  const { points, distances } = route;
  let i = 1;
  while (i < points.length - 1 && distances[i] < distance) i++;
  const a = points[i - 1],
    b = points[i],
    span = distances[i] - distances[i - 1];
  return {
    ...blend(
      a,
      b,
      Math.max(0, Math.min(1, (distance - distances[i - 1]) / (span || 1))),
    ),
    dx: b.x - a.x,
    dz: b.z - a.z,
  };
}
