import {
  cleanCounts,
  changeCount,
  readDiscoveries,
  rememberDiscoveries,
} from "./CollectionCounts";
import catalog from "./Collectibles.json";
export const fishSpecies = catalog.fish;
export const fishHabitats = {
  freshwater: "Pond · freshwater",
  saltwater: "Ocean & coast · saltwater",
};
const fishIds = new Set(fishSpecies.map((f) => f.id));
const weights = {
  Common: 8,
  Uncommon: 4,
  Rare: 1.2,
  "Very rare": 0.4,
};
// One exceptional species has its own 1/1000 successful-catch roll. Everything
// else is selected by rarity, independent of whether the current cast succeeds.
export function chooseFish(random = Math.random, habitat = null) {
  // A cast can award only residents of the water it lands in. Filter before
  // rolling rarity so a rare roll cannot leak a pond creature into the sea.
  const eligible = fishSpecies.filter((f) => !habitat || f.habitat === habitat);
  if (!eligible.length) return null;
  const roll = random();
  const special = eligible.find((f) => f.rarity === "Super rare");
  if (roll < 0.001 && special) return special;
  const pool = eligible.filter((f) => f.rarity !== "Super rare"),
    total = pool.reduce((sum, f) => sum + weights[f.rarity], 0);
  if (!pool.length) return special || null;
  let value = Math.max(0, (roll - 0.001) / 0.999) * total;
  for (const fish of pool) {
    value -= weights[fish.rarity];
    if (value < 0) return fish;
  }
  return pool.at(-1);
}
export function readAquariums() {
  try {
    return cleanAquariums(
      JSON.parse(localStorage.getItem("world-aquariums") || "{}"),
    );
  } catch {
    return {};
  }
}
export const cleanAquariums = (saved) => cleanCounts(saved, fishIds);
export const addFish = (saved, id) => changeCount(saved, id, 1, fishIds);
export const removeFish = (saved, id) => changeCount(saved, id, -1, fishIds);
export function saveAquariums(saved) {
  const clean = cleanAquariums(saved);
  rememberDiscoveries(
    "world-fish-discoveries",
    { ...readAquariums(), ...clean },
    fishIds,
  );
  try {
    localStorage.setItem("world-aquariums", JSON.stringify(clean));
  } catch {}
  return clean;
}
export const discoveredFish = (counts) =>
  readDiscoveries("world-fish-discoveries", counts, fishIds);
