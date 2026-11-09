// Each species starts in a suitable habitat. Visitors can pick any of the five
// homes, with the choice remembered separately for each species.
const storageKey = "world-bug-homes";
export const bugHomes = {
  terrarium: "Moss and driftwood",
  "habitat-mantises": "Fern understory",
  "habitat-butterflies": "Flower meadow",
  "habitat-dragonflies": "Pondside reeds",
  "habitat-ladybugs": "Wildflower garden",
};
export function readBugHomes() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Object.fromEntries(
      Object.entries(saved || {}).filter(([, home]) =>
        Object.hasOwn(bugHomes, home),
      ),
    );
  } catch {
    return {};
  }
}
export function bugHomeFor(species, preferences) {
  const preferred = preferences[species.id];
  const natural = "habitat-" + species.category?.toLowerCase();
  return (
    preferred || (Object.hasOwn(bugHomes, natural) ? natural : "terrarium")
  );
}
export function saveBugHomes(preferences) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // The choice still applies for this visit.
  }
}
