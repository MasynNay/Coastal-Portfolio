import appearances from "./Appearances.json";

// World units per second. NPCs stroll slowly enough for the player to catch up.
// Body sizes are shared by controlled and roaming actors.
export const walkSpeed = 8.5;
export const npcWalkSpeed = 5.2;
export const runSpeed = 14;
// Exporters read these same heights when fitting a rider to the shared bike.
const heights = Object.fromEntries(
  appearances.filter((o) => o.default).map((o) => [o.character, o.height]),
);
export const personHeight = (id) => heights[id] || heights.masyn;
export function animalHeight(animal) {
  return animal.kind === "dog"
    ? 1.08
    : animal.kind === "land"
      ? 0.75
      : animal.kind === "goose"
        ? 1.22
        : animal.kind === "duck"
          ? 0.92
          : /fish|koi/.test(animal.id)
            ? 0.72
            : 0.86;
}
