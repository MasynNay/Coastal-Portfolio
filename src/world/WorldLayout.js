import places from "./PlaceArt.json";
// Art-scaled thresholds are shared by navigation, auto-entry, click targets and fast travel.
export const roomBounds = {
  halfWidth: 12.5,
  back: -9.5,
  front: 10.5,
};
export const roomEntrance = {
  x: 0,
  z: 7.8,
};
export const roomExit = {
  x: 0,
  z: 10,
};
export const buildingHeight = (b) =>
  places["building-" + b.id]?.worldHeight || 8;
export const doorOffset = (b) => {
  const art = places["building-" + b.id];
  return art
    ? Math.max(1.2, 3.1 - (1 - art.openingBottom) * art.worldHeight + 0.65)
    : 3.9;
};
export const doorPosition = (b) => ({
  x: b.x,
  z: b.z + doorOffset(b) - 0.65,
});
export const doorApproach = (b) => ({
  x: b.x,
  z: Math.floor(b.z + doorOffset(b)),
});
export const doorArrival = (b) => ({
  x: b.x,
  z: b.z + 4.6,
});
export function enteringBuilding(position, previous, buildings) {
  if (
    position.z > previous.z ||
    Math.hypot(position.x - previous.x, position.z - previous.z) < 0.0001
  )
    return null;
  return (
    buildings.find(
      (b) =>
        Math.abs(position.x - b.x) < 0.85 &&
        position.z <= b.z + doorOffset(b) &&
        position.z > b.z + doorOffset(b) - 1,
    )?.id || null
  );
}
export function leavingRoom(position, previous) {
  return (
    position.z > previous.z && Math.abs(position.x) < 1.15 && position.z >= 9.5
  );
}
