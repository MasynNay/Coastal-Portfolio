import places from "./PlaceArt.json";
// Art-scaled thresholds are shared by navigation, auto-entry, click targets and fast travel.
export const roomBounds = {
  halfWidth: 12.5,
  back: -9.5,
  front: 10.5,
};
// Feet stay on the painted floor. Each house has a different back wall and
// side furnishing depth; the central doorway is the only front-wall opening.
const floorEdges = {
  home: { halfWidth: 10.5, back: -5.25, front: 7.1 },
  skills: { halfWidth: 9.8, back: -5.4, front: 7.35 },
  portfolio: { halfWidth: 9.9, back: -5.55, front: 7.0 },
  resume: { halfWidth: 9.9, back: -5.35, front: 7.1 },
  contact: { halfWidth: 8.65, back: -5.5, front: 7.55 },
  lodge: { halfWidth: 10.05, back: -5.05, front: 7.15 },
};
export function onRoomFloor(room, x, z) {
  const floor = floorEdges[room] || floorEdges.home;
  return (
    Math.abs(x) < floor.halfWidth &&
    z > floor.back &&
    (z < floor.front || (Math.abs(x) < 1.45 && z < roomBounds.front))
  );
}
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
