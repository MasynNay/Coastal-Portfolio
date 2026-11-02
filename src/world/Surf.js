import { isOcean, pond } from "./TownLayout";
import { fenceBlocksTravel } from "./Fence";
export const axolotlColors = {
  masyn: "ocean blue",
  "mi-shell": "coral pink",
  ezra: "lavender",
  fallyn: "mint green",
  fitzgerald: "golden yellow",
  link: "ocean blue",
};
export function isWater(x, z) {
  return (
    isOcean(x, z) ||
    ((x - pond.x) / (pond.rx + pond.bank)) ** 2 +
      ((z - pond.z) / (pond.rz + pond.bank)) ** 2 <=
      1
  );
}
// Mount/fishing targets sit on blue water; mounted movement remains active
// across the narrow bank until reaching walkable land beyond its outside edge.
export function isWaterSurface(x, z) {
  return (
    isOcean(x, z) ||
    ((x - pond.x) / pond.rx) ** 2 + ((z - pond.z) / pond.rz) ** 2 <= 1
  );
}
// Search close to the facing direction, never teleport across a seawall or a wide strip of land.
export function surfEntry(position, direction, canEnter) {
  for (const turn of [0, -1, 1, -2, 2])
    for (const distance of [0.6, 0.9, 1.15]) {
      const angle = ((direction + turn) * Math.PI) / 4;
      const point = {
        x: position.x + Math.sin(angle) * distance,
        z: position.z + Math.cos(angle) * distance,
      };
      if (
        isWaterSurface(point.x, point.z) &&
        !fenceBlocksTravel(position, point) &&
        canEnter(point)
      )
        return point;
    }
  return null;
}
