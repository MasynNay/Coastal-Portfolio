import { heroOutfits } from "./Heroes";
import appearances from "./Appearances.json";
// Costumes belong to an existing family member. The stored outfit survives
// leaving a room; the canvas and character picker resolve the same available art.
export const outfits = [
  ...appearances
    .filter((o) => o.character === "masyn")
    .map((o) => ({
      ...o,
      name: o.outfitName || o.name,
    })),
  ...heroOutfits,
];
export function characterAsset(character, outfit) {
  return (
    outfits.find(
      (o) =>
        o.character === character && o.id === outfit && o.available !== false,
    )?.asset || character
  );
}
// Activities use the selected appearance, just like walking. Keeping this
// lookup here prevents bikes/boards/fishing from quietly reverting to a hoodie.
// An unloaded or unavailable action keeps the same-costume standing fallback.
export function activityAsset(character, outfit, action, sheets) {
  const base = characterAsset(character, outfit);
  const animated = `${base}-${action}`;
  return sheets[animated] ? animated : base;
}
export function characterSelection(id) {
  if (id.startsWith("outfit:")) {
    const outfit = id.slice(7);
    const item = outfits.find((o) => o.id === outfit && o.available !== false);
    return item
      ? {
          character: item.character,
          outfit,
        }
      : null;
  }
  return appearances.some((o) => o.default && o.character === id)
    ? {
        character: id,
        outfit: null,
      }
    : null;
}
