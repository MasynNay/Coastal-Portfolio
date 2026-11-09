import { chooseByRarity } from "./Rarity";
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
// The super-rare tier has a 1/1000 successful-catch roll. Everything
// else is selected by rarity, independent of whether the current cast succeeds.
export function chooseFish(random = Math.random, habitat = null) {
  // A cast can award only residents of the water it lands in. Filter before
  // rolling rarity so a rare roll cannot leak a pond creature into the sea.
  const eligible = fishSpecies.filter((f) => !habitat || f.habitat === habitat);
  return chooseByRarity(eligible, random);
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
