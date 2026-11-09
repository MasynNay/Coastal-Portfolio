import { obstacles, buildings } from "./config";
import { canStand, findPath } from "./navigation";
import { clearLine, smoothPath } from "./Paths";
import { doorArrival, doorPosition } from "./WorldLayout";
import { pond } from "./TownLayout";
import { npcWalkSpeed } from "./Movement";
import { movementDirection } from "./animation";
import { bikes } from "./Bikes";
import { groveInteraction } from "./ForestGrove";
import { skateboard } from "./SkateRide";
import { surfboard } from "./SurfRide";
import { watercraft } from "./Harbor";

export const residentOutingStops = {
  grove: groveInteraction,
  skateboard,
  surfboard,
  boat: {
    x: watercraft[0].boardX,
    z: watercraft[0].boardZ,
  },
};

export const children = ["ezra", "fallyn", "fitzgerald"];
const playground = [
  [12, -6],
  [24, -6],
  [25, 3.5],
  [20.5, 3.8],
  [15.5, 3.7],
  [11.7, 3.5],
];
const townStops = [
  [-25, -11],
  [-8, -11],
  [8, -11],
  [25, -11],
  [-8, 7],
  [8, 7],
  [-25, 7],
  [25, 7],
  [-8, 18],
  [8, 18],
  [-24, 18],
  [24, 18],
  [0, 13],
  [0, 18],
];
const blockers = obstacles.map((o) =>
  o.rx
    ? { ...o, rx: o.rx + 0.12, rz: o.rz + 0.12 }
    : o.radius
      ? { ...o, radius: o.radius + 0.12 }
      : { ...o, w: o.w + 0.24, d: o.d + 0.24 },
);
// Routes share finished paths. They are planned only when a new itinerary begins,
// never inside each animation frame. At most three itineraries per person are kept.
const paths = new Map();
function routeBetween(from, to) {
  const key = `${from.x},${from.z}:${to.x},${to.z}`;
  if (!paths.has(key))
    paths.set(key, smoothPath(from, findPath(from, to, obstacles), blockers));
  return paths.get(key);
}
function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
export function createResidentRoute(id, variant, seed) {
  const index = ["masyn", "mi-shell", ...children].indexOf(id),
    child = children.includes(id);
  const random = randomSource(seed + index * 1103 + variant * 10007);
  const home = child ? { x: 12, z: -6 } : { x: -4, z: 9 };
  let cursor = { ...home },
    duration = 0,
    walked = 0,
    facing = 0;
  const segments = [];
  function segment(to, water = false, activity = "walking") {
    const from = { ...cursor },
      length = Math.hypot(to.x - from.x, to.z - from.z);
    if (length < 0.001) return;
    const speed = water ? npcWalkSpeed * 0.65 : npcWalkSpeed;
    const ramp = Math.min(0.3, Math.sqrt((length * 0.3) / speed)),
      peak = (speed * ramp) / 0.3,
      seconds = length / peak + ramp;
    facing = movementDirection(to.x - from.x, to.z - from.z);
    segments.push({
      from,
      to: { ...to },
      start: duration,
      seconds,
      length,
      ramp,
      peak,
      walked,
      direction: facing,
      water,
      activity,
    });
    duration += seconds;
    walked += length;
    cursor = { ...to };
  }
  function walk(to) {
    if (!canStand(to.x, to.z, obstacles)) return false;
    for (const p of routeBetween(cursor, to)) segment(p);
    if (
      Math.hypot(cursor.x - to.x, cursor.z - to.z) < 1 &&
      clearLine(cursor, to, blockers)
    )
      segment(to);
    return Math.hypot(cursor.x - to.x, cursor.z - to.z) < 0.15;
  }
  function rest(
    seconds,
    {
      water = false,
      room = null,
      activity = "resting",
      target = null,
      bike = null,
      outing = null,
    } = {},
  ) {
    if (target)
      facing = movementDirection(target.x - cursor.x, target.z - cursor.z);
    segments.push({
      from: { ...cursor },
      to: { ...cursor },
      start: duration,
      seconds,
      walked,
      direction: facing,
      water,
      room,
      playing: true,
      activity,
      target,
      bike,
      outing,
    });
    duration += seconds;
  }
  const stopAt = (p) => {
    if (walk({ x: p[0], z: p[1] })) rest(2 + random() * 3);
  };
  // Rotate outings between itineraries. Visit the real interaction spot before
  // requesting a turn, and continue the walk from that spot afterward.
  const outingIds = Object.keys(residentOutingStops);
  const outing = outingIds[(index + variant) % outingIds.length];
  const visitOuting = () => {
    if (walk(residentOutingStops[outing]))
      rest(5, { activity: "waiting", outing });
  };
  if (child) {
    // Long playground visits are a preference, not a boundary around the kids.
    for (let lap = 0; lap < 3; lap++) {
      for (const p of playground) {
        if (walk({ x: p[0], z: p[1] }))
          rest(9 + random() * 3, { activity: "playground" });
      }
      if (lap === 0) visitOuting();
    }
  } else {
    visitOuting();
    for (let n = 0; n < 5; n++)
      stopAt(townStops[Math.floor(random() * townStops.length)]);
  }
  // Every itinerary takes a different walk across the island before its activities.
  for (let n = 0; n < (child ? 2 : 4); n++)
    stopAt(townStops[Math.floor(random() * townStops.length)]);
  const approach = { x: 0, z: 3 },
    gate = { x: pond.x, z: pond.z + pond.rz };
  if (walk(approach)) {
    rest(0.6);
    segment(gate, true, "pond-surf");
    for (let n = 1; n <= 12; n++) {
      const angle = (n * Math.PI * 2) / 12;
      segment(
        {
          x: pond.x + Math.sin(angle) * pond.rx * 0.62,
          z: pond.z + Math.cos(angle) * pond.rz * 0.62,
        },
        true,
        "pond-surf",
      );
      if (n === 5)
        rest(5 + random() * 3, {
          water: true,
          activity: "fishing",
          target: { x: pond.x, z: pond.z },
        });
    }
    segment(gate, true, "pond-surf");
    segment(approach, true, "pond-surf");
  }
  // The pier is the only coastal opening. Residents mount beside it, make a
  // short ocean excursion and return through that same opening without crossing rails.
  const dock = { x: 0, z: 29.8 },
    side = (index + variant) % 2 ? 1 : -1;
  if (walk(dock)) {
    // Leave south of the rental berths and pier crates and loop outside their solid hulls.
    rest(2, { activity: "fishing", target: { x: side * 4, z: 29 } });
    segment({ x: side * 3.5, z: 29.8 }, true, "ocean-surf");
    for (const [x, z] of [
      [7, 30],
      [14, 30],
      [22, 29],
      [23, 31],
      [12, 31],
      [8, 31],
      [8, 30],
      [3.5, 29.8],
    ]) {
      segment({ x: x * side, z }, true, "ocean-surf");
      if (x === 23)
        rest(5 + random() * 3, {
          water: true,
          activity: "fishing",
          target: { x: side * 26, z: 29 },
        });
    }
    segment(dock, true, "ocean-surf");
    rest(1);
  }
  // A short rental stop asks the shared bike coordinator for a free bicycle.
  const bike = bikes[(index + variant) % bikes.length];
  if (walk({ x: 25, z: Math.round(bike.z) }))
    rest(8, { activity: "bikes", bike: bike.id });
  const houses = [...buildings];
  for (let n = houses.length - 1; n > 0; n--) {
    const j = Math.floor(random() * (n + 1));
    [houses[n], houses[j]] = [houses[j], houses[n]];
  }
  for (const building of houses.slice(0, 2)) {
    const outside = doorArrival(building);
    if (!walk(outside)) continue;
    segment(doorPosition(building));
    rest(2.5 + random() * 2, { room: building.id, activity: "visiting" });
    segment(outside);
  }
  walk(home);
  rest(child ? 8 : 4, { activity: child ? "playground" : "resting" });
  return { segments, duration, distance: walked };
}
