import {
  cleanCounts,
  changeCount,
  readDiscoveries,
  rememberDiscoveries,
} from "./CollectionCounts";
import catalog from "./Collectibles.json";
import { townDecor } from "./TownLayout";

// Every group has the same roster size and rarity profile. Old saved IDs remain valid.
export const terrariumSpecies = catalog.spiders.map((s) => ({
  ...s,
  chance: 0.1,
  x: 0,
  z: 0,
  category: s.category || "Spiders",
  description: `${s.name}: ${s.design}.`,
}));
export const bugSpecies = terrariumSpecies.filter((s) => !s.legacy);
const bugIds = new Set(terrariumSpecies.map((s) => s.id));
export const bugCategories = [...new Set(bugSpecies.map((s) => s.category))];
export const bugTrees = townDecor
  .filter(([id]) => /tree|pine|palm/.test(id))
  .map(([art, x, z, h], i) => ({ id: `tree-${i}`, art, x, z, h }));
const weights = { Common: 8, Uncommon: 4, Rare: 1.2, "Very rare": 0.4 };
// Choose a category first: catalog size and rarity weights can never favor spiders.
// Then roll rarity within that category. All groups share the same rarity profile.
export function chooseBug(random = Math.random, excluded = new Set()) {
  const groups = bugCategories
    .map((category) =>
      bugSpecies.filter((s) => s.category === category && !excluded.has(s.id)),
    )
    .filter((group) => group.length);
  if (!groups.length) return null;
  const pool = groups[
    Math.min(groups.length - 1, Math.floor(random() * groups.length))
  ]
    .slice()
    .sort(
      (a, b) =>
        ["Common", "Uncommon", "Rare", "Very rare", "Super rare"].indexOf(
          a.rarity,
        ) -
        ["Common", "Uncommon", "Rare", "Very rare", "Super rare"].indexOf(
          b.rarity,
        ),
    );
  const roll = random();
  const special = pool.find((s) => s.rarity === "Super rare");
  if (roll < 0.001 && special) return special;
  const ordinary = pool.filter((s) => s.rarity !== "Super rare");
  if (!ordinary.length) return special || null;
  let value =
    Math.max(0, (roll - 0.001) / 0.999) *
    ordinary.reduce((sum, s) => sum + weights[s.rarity], 0);
  return (
    ordinary.find((s) => (value -= weights[s.rarity]) < 0) || ordinary.at(-1)
  );
}
export function readTerrariums() {
  try {
    return cleanCounts(
      JSON.parse(localStorage.getItem("world-spiders") || "{}"),
      bugIds,
    );
  } catch {
    return {};
  }
}
export function saveTerrariums(counts) {
  const clean = cleanCounts(counts, bugIds);
  rememberDiscoveries(
    "world-bug-discoveries",
    { ...readTerrariums(), ...clean },
    bugIds,
  );
  try {
    localStorage.setItem("world-spiders", JSON.stringify(clean));
  } catch {}
  return clean;
}
export const discoveredBugs = (counts) =>
  readDiscoveries("world-bug-discoveries", counts, bugIds);
export const addBug = (counts, id) => changeCount(counts, id, 1, bugIds);
export const removeBug = (counts, id) => changeCount(counts, id, -1, bugIds);
// No ambient spawns and no automatic replacements. A deliberate tree shake owns
// exactly three rolls. Three batches at most can be loose, keeping map work bounded.
export function createBugSpawns(
  value = Math.floor(Math.random() * 1000000) + 1,
) {
  let seed = value;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const loose = new Map(),
    cooldowns = new Map();
  let shake = null;
  function expire(time) {
    for (const [id, b] of loose)
      if (time - b.started > 120000) loose.delete(id);
  }
  return {
    shake(tree, time, canVisit = () => true) {
      expire(time);
      if (time - (cooldowns.get(tree.id) ?? -Infinity) < 12000)
        return { count: 0, reason: "Let this tree settle for a moment." };
      const excluded = new Set(loose.keys());
      const available = bugSpecies.filter((s) => !excluded.has(s.id));
      if (available.length < 3)
        return {
          count: 0,
          reason:
            "The branches are quiet. Try another tree later, or release a resident.",
        };
      // Search dry, unobstructed clearings below the canopy; never drop on a house or water.
      const spots = [];
      for (let i = 0; i < 36 && spots.length < 3; i++) {
        const angle = Math.PI * (0.12 + (0.76 * (i % 12)) / 11),
          distance = 1.5 + Math.floor(i / 12) * 0.65;
        const p = {
          x: tree.x + Math.cos(angle) * distance,
          z: tree.z + Math.sin(angle) * distance,
        };
        if (
          canVisit(p) &&
          spots.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > 1)
        )
          spots.push(p);
      }
      if (spots.length < 3)
        return {
          count: 0,
          reason: "There isn't enough clear ground under this tree.",
        };
      while (loose.size > 6) {
        const first = loose.values().next().value;
        for (const [id, b] of loose)
          if (b.tree === first.tree) loose.delete(id);
      }
      spots.forEach((p) => {
        const species = chooseBug(random, excluded);
        excluded.add(species.id);
        loose.set(species.id, { ...p, tree: tree.id, started: time });
      });
      cooldowns.set(tree.id, time);
      shake = { ...tree, started: time };
      return { count: 3 };
    },
    active(time) {
      expire(time);
      return new Set(loose.keys());
    },
    visible(id, time) {
      expire(time);
      return !bugIds.has(id) || loose.has(id);
    },
    position(id, time) {
      expire(time);
      const b = loose.get(id);
      return b
        ? {
            ...b,
            lift: 3 * Math.pow(Math.max(0, 1 - (time - b.started) / 650), 2),
          }
        : null;
    },
    treeShake(time) {
      return shake && time - shake.started < 650 ? shake : null;
    },
    catch(id, time) {
      expire(time);
      const b = loose.get(id);
      if (!b || time - b.started < 650) return false;
      loose.delete(id);
      return true;
    },
  };
}
