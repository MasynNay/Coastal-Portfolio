import { buildings } from "./config";
import { pond } from "./TownLayout";
import { roomEntrance, doorArrival } from "./WorldLayout";
// An indoor journey stays indoors; outdoor house journeys keep the doorway arrival.
// The center minimap destination is always outside and already mounted on water.
export function travelTarget(id, originRoom) {
  if (id === "pond")
    return {
      id,
      room: null,
      position: {
        x: pond.x,
        z: pond.z,
      },
      surfing: true,
    };
  const home = buildings.find((b) => b.id === id);
  if (!home) return null;
  return {
    id,
    room: originRoom ? id : null,
    position: originRoom
      ? {
          ...roomEntrance,
        }
      : doorArrival(home),
    surfing: false,
  };
}
