// One coast drives sand, waves, walking/surfing and the minimap. The fence stays
// in its original position, so the wraparound beach is reached through the pier.
export const island = { left: -28.5, right: 28.5, back: -29.5, front: 20 };
export const beach = { left: -32.5, right: 32.5, back: -33.3, front: 24.2 };
export const oceanBounds = { left: -38, right: 38, back: -38, front: 38 };
// Both the wooden terrain and shoreline mask use the visible deck's exact
// bounds. A wider sampled gap used to leave bare sand beside the pier.
export const pierDeck = { x: -3, z: 20, w: 6, d: 12 };
export const shoreline = (x) =>
  beach.front + Math.sin(x * 0.31) * 0.28 + Math.cos(x * 0.67) * 0.12;
export const northShore = (x) => beach.back + Math.sin(x * 0.23) * 0.22;
const westShore = (z) => beach.left + Math.sin(z * 0.21) * 0.18;
const eastShore = (z) => beach.right + Math.sin(z * 0.25) * 0.18;
export function isBeachLand(x, z) {
  return (
    x >= westShore(z) &&
    x <= eastShore(z) &&
    z >= northShore(x) &&
    z <= shoreline(x)
  );
}
export function isSand(x, z) {
  const inland =
    x >= island.left &&
    x <= island.right &&
    z >= island.back &&
    z <= island.front;
  const pier = Math.abs(x) <= 3.5 && z >= 20;
  return isBeachLand(x, z) && !inland && !pier;
}
// Find each true meeting point of the wavy edges before sampling. Independently
// ending each edge at the rectangular bounds produced little doubled-back
// segments at the corners, which made animated foam cross over itself.
function shoreCorner(side, end, x, z) {
  for (let i = 0; i < 8; i++) {
    x = side(z);
    z = end(x);
  }
  return { x, z };
}
const corners = [
  shoreCorner(westShore, northShore, beach.left, beach.back),
  shoreCorner(eastShore, northShore, beach.right, beach.back),
  shoreCorner(eastShore, shoreline, beach.right, beach.front),
  shoreCorner(westShore, shoreline, beach.left, beach.front),
];
// Collision, terrain, minimap and the wash all follow these same four edges.
const steps = 100;
export const beachOutline = corners.flatMap((start, edge) => {
  const end = corners[(edge + 1) % 4];
  return Array.from({ length: steps }, (_, i) => {
    if (edge % 2 === 0) {
      const x = start.x + ((end.x - start.x) * i) / steps;
      return { x, z: (edge === 0 ? northShore : shoreline)(x) };
    }
    const z = start.z + ((end.z - start.z) * i) / steps;
    return { x: (edge === 1 ? eastShore : westShore)(z), z };
  });
});
