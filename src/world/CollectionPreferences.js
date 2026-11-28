import { useEffect, useState } from "react";
import { terrariumSpecies } from "./Bugs";
import { fishSpecies } from "./Fish";
import { shellSpecies } from "./Shells";
import { cardsById } from "./CardCatalog";

// Only collection IDs are saved here. Preferences never own catches, award
// cards, or change rarity rolls; the engine and collection stores remain authoritative.
export const preferenceKey = "island-collection-preferences";
export const collectionChange = "island-preferences-changed";
export const collectionIds = {
  bugs: new Set(terrariumSpecies.map((s) => s.id)),
  fish: new Set(fishSpecies.map((s) => s.id)),
  shells: new Set(shellSpecies.map((s) => s.id)),
  cards: new Set(Object.keys(cardsById)),
};
export function cleanPreferences(value) {
  return Object.fromEntries(
    Object.entries(collectionIds).map(([kind, ids]) => [
      kind,
      [
        ...new Set(
          (Array.isArray(value?.[kind]) ? value[kind] : []).filter((id) =>
            ids.has(id),
          ),
        ),
      ],
    ]),
  );
}
export function readPreferences() {
  try {
    return cleanPreferences(JSON.parse(localStorage.getItem(preferenceKey)));
  } catch {
    return cleanPreferences(null);
  }
}
export function useFavorites(kind) {
  const [all, setAll] = useState(readPreferences);
  useEffect(() => {
    const update = () => setAll(readPreferences());
    window.addEventListener(collectionChange, update);
    return () => window.removeEventListener(collectionChange, update);
  }, []);
  return {
    favorites: all[kind] || [],
    toggle: (id) => {
      if (!collectionIds[kind]?.has(id)) return;
      const next = readPreferences(),
        ids = next[kind];
      next[kind] = ids.includes(id)
        ? ids.filter((saved) => saved !== id)
        : [...ids, id];
      try {
        localStorage.setItem(preferenceKey, JSON.stringify(next));
        window.dispatchEvent(new Event(collectionChange));
      } catch {
        setAll(next);
      }
    },
  };
}
export const sortCreatures = (items, sort) =>
  [...items].sort((a, b) =>
    sort === "Rarity"
      ? ["Common", "Uncommon", "Rare", "Very rare", "Super rare"].indexOf(
          b.rarity,
        ) -
          ["Common", "Uncommon", "Rare", "Very rare", "Super rare"].indexOf(
            a.rarity,
          ) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name),
  );
