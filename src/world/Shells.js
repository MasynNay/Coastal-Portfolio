import {
  cleanCounts,
  changeCount,
  readDiscoveries,
  rememberDiscoveries,
} from "./CollectionCounts";
import { isSand, shoreline, northShore } from "./Coast";
const types = [
  "scallop",
  "conch",
  "cowrie",
  "nautilus",
  "sand dollar",
  "olive shell",
  "whelk",
  "cockle",
  "limpet",
  "turban shell",
];
const palettes = ["Ivory", "Rose", "Sage", "Blue", "Golden"];
export const shellSpecies = palettes.flatMap((color, row) =>
  types.map((type, column) => {
    const index = row * 10 + column;
    return {
      id: `shell-${index + 1}`,
      art: `shell-${index + 1}`,
      name: index === 49 ? "Aurora turban shell" : `${color} ${type}`,
      category: type[0].toUpperCase() + type.slice(1),
      rarity:
        index === 49
          ? "Super rare"
          : ["Common", "Common", "Uncommon", "Rare", "Very rare"][row],
      description: `An empty ${type} shell washed onto the island beach.`,
      design: `${color.toLowerCase()} ridges and ocean-worn highlights`,
    };
  }),
);
const ids = new Set(shellSpecies.map((s) => s.id));
export function readShells() {
  try {
    return cleanCounts(
      JSON.parse(localStorage.getItem("world-shells") || "{}"),
      ids,
    );
  } catch {
    return {};
  }
}
export function saveShells(counts) {
  const clean = cleanCounts(counts, ids);
  rememberDiscoveries(
    "world-shell-discoveries",
    { ...readShells(), ...clean },
    ids,
  );
  try {
    localStorage.setItem("world-shells", JSON.stringify(clean));
  } catch {}
  return clean;
}
export const addShell = (counts, id) =>
  saveShells(changeCount(counts, id, 1, ids));
export const discoveredShells = (counts) =>
  readDiscoveries("world-shell-discoveries", counts, ids);
export function chooseShell(random = Math.random) {
  if (random() < 0.001) return shellSpecies[49];
  const pool = shellSpecies.slice(0, 49),
    weights = { Common: 8, Uncommon: 3, Rare: 1, "Very rare": 0.25 };
  let roll = random() * pool.reduce((sum, s) => sum + weights[s.rarity], 0);
  for (const shell of pool) {
    roll -= weights[shell.rarity];
    if (roll < 0) return shell;
  }
  return pool.at(-1);
}
// Each coast keeps its own small set of pickups, so a south-beach visit cannot
// leave the north/east/west shores empty. Positions stay on dry, clear sand.
export const shellBeaches = {
  south: Array.from({ length: 14 }, (_, i) => -26 + i * 4)
    .filter((x) => Math.abs(x) > 4)
    .flatMap((x) => [20.9, 22.5].map((z) => ({ x, z }))),
  north: Array.from({ length: 14 }, (_, i) => {
    const x = -26 + i * 4;
    return { x, z: northShore(x) + 1.2 };
  }),
  east: Array.from({ length: 12 }, (_, i) => ({ x: 30.6, z: -27 + i * 4 })),
  west: Array.from({ length: 12 }, (_, i) => ({ x: -30.6, z: -27 + i * 4 })),
};
export function createShellSpawns(random = Math.random) {
  const slots = Object.keys(shellBeaches).flatMap((region) =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `beach-shell-${region}-${i}`,
      region,
      due: 0,
      spawn: null,
    })),
  );
  return {
    update(time, player) {
      for (const slot of slots) {
        if (slot.spawn || time < slot.due) continue;
        const free = shellBeaches[slot.region].filter(
          (p) =>
            isSand(p.x, p.z) &&
            p.z < shoreline(p.x) - 0.8 &&
            Math.hypot(p.x - player.x, p.z - player.z) > 4 &&
            !slots.some(
              (s) =>
                s.spawn && Math.hypot(s.spawn.x - p.x, s.spawn.z - p.z) < 2,
            ),
        );
        if (!free.length) continue;
        const point =
            free[Math.min(free.length - 1, Math.floor(random() * free.length))],
          shell = chooseShell(random);
        slot.spawn = {
          ...point,
          id: slot.id,
          shellId: shell.id,
          art: shell.art,
          h: 0.7,
          type: "shell",
          label: `Collect ${shell.name}`,
        };
      }
    },
    collect(id, time) {
      const slot = slots.find((s) => s.id === id && s.spawn);
      if (!slot) return null;
      const shell = shellSpecies.find((s) => s.id === slot.spawn.shellId);
      slot.spawn = null;
      slot.due = time + 18000 + random() * 12000;
      return shell;
    },
    snapshot: () => slots.flatMap((s) => (s.spawn ? [{ ...s.spawn }] : [])),
  };
}
