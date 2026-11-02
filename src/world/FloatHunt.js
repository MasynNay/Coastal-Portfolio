import { isSand, isBeachLand } from "./Coast";
const colors = [
  "Seafoam",
  "Aqua",
  "Cobalt",
  "Rose",
  "Amber",
  "Lavender",
  "Emerald",
  "Sky blue",
  "Coral",
  "Pearl",
  "Teal",
  "Violet",
  "Ruby",
  "Lime",
  "Sunset",
  "Ice blue",
  "Magenta",
  "Moss",
  "Honey",
  "Rainbow",
];
// Stable collectible IDs/art are separate from the randomized hiding locations.
export const glassFloats = colors.map((color, index) => ({
  id: `float-${index + 1}`,
  index,
  name: `${color} glass float`,
  art: `glass-float-${index + 1}`,
  h: 0.95,
}));
const key = "world-glass-floats",
  valid = new Set(glassFloats.map((f) => f.id));
export function readFloatHunt() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    const clean = (items) => [
      ...new Set(
        (Array.isArray(items) ? items : []).filter((id) => valid.has(id)),
      ),
    ];
    const positions = (
      Array.isArray(saved?.positions) ? saved.positions : []
    ).filter(
      (p) =>
        Number.isFinite(p.x) &&
        Number.isFinite(p.z) &&
        Math.abs(p.x) < 34 &&
        p.z > -34 &&
        p.z < 25,
    );
    return {
      active: !!saved?.active,
      found: clean(saved?.found),
      discovered: clean(saved?.discovered || saved?.found),
      positions: positions.length === 20 ? positions : [],
    };
  } catch {
    return { active: false, found: [], discovered: [], positions: [] };
  }
}
function shuffle(items, random) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
// Validate once when hiding. At least three floats go to EACH beach edge;
// remaining floats use open island clearings. No per-frame random generation.
export function floatLocations(random = Math.random, canVisit = () => true) {
  const zones = { north: [], south: [], east: [], west: [], town: [] };
  for (let z = -32; z <= 23; z += 2)
    for (let x = -31; x <= 31; x += 2) {
      const p = {
        x: x + (random() - 0.5) * 0.35,
        z: z + (random() - 0.5) * 0.35,
      };
      // Click-to-walk searches on integer grid nodes. The drawing and its
      // nearest node must both be clear before a float can hide here.
      if (
        !isBeachLand(p.x, p.z) ||
        !canVisit(p) ||
        !canVisit({ x: Math.round(p.x), z: Math.round(p.z) })
      )
        continue;
      const zone = isSand(p.x, p.z)
        ? p.z < -29.5
          ? "north"
          : p.z > 20
            ? "south"
            : p.x > 28.5
              ? "east"
              : "west"
        : "town";
      zones[zone].push(p);
    }
  const picked = [];
  function take(pool, count) {
    for (const p of shuffle(pool, random))
      if (picked.every((q) => Math.hypot(p.x - q.x, p.z - q.z) > 2.8)) {
        picked.push(p);
        if (--count === 0) break;
      }
  }
  for (const zone of ["north", "south", "east", "west"]) take(zones[zone], 3);
  take(zones.town, 20 - picked.length);
  if (picked.length < 20) take(Object.values(zones).flat(), 20 - picked.length);
  return shuffle(picked, random).slice(0, 20);
}
export function createFloatHunt(random = Math.random) {
  let saved = readFloatHunt(),
    started = -Infinity;
  const persist = () => {
    try {
      localStorage.setItem(key, JSON.stringify(saved));
    } catch {}
  };
  return {
    start(time, canVisit = () => true, restart = false) {
      // Reloading resumes the same hidden set. A deliberate fresh hunt picks
      // new positions and resets this round while retaining lifetime colors.
      if (restart || !saved.active || saved.positions.length !== 20) {
        const positions = floatLocations(random, canVisit);
        if (positions.length !== 20) return false;
        saved = { ...saved, active: true, found: [], positions };
        started = time;
      }
      persist();
      return true;
    },
    collect(id) {
      if (!saved.active || saved.found.includes(id) || !valid.has(id))
        return null;
      saved.found = [...saved.found, id];
      saved.discovered = [...new Set([...saved.discovered, id])];
      persist();
      return { ...saved, found: [...saved.found] };
    },
    points() {
      return saved.active
        ? glassFloats.flatMap((float, i) =>
            saved.found.includes(float.id) || !saved.positions[i]
              ? []
              : [{ ...float, ...saved.positions[i] }],
          )
        : [];
    },
    snapshot() {
      return {
        ...saved,
        found: [...saved.found],
        discovered: [...saved.discovered],
        started,
      };
    },
  };
}
