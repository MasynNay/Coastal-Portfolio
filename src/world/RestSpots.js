import { buildings } from "./TownLayout";
const ocean = buildings.find((b) => b.id === "contact");
// Positions drive art, collision and the same E/touch interaction. The chair
// remains outside the path; the seahorse occupies the ocean home's side lawn.
export const restSpots = [
  {
    id: "seahorse-rocker",
    art: "seahorse-rocker",
    label: "Ride the seahorse",
    x: ocean.x - 6.5,
    z: ocean.z + 3.3,
    h: 1.9,
    direction: 2,
    seatX: -0.18,
    seatZ: -0.4,
  },
];
export const restObstacles = restSpots.map((p) => ({
  x: p.x,
  z: p.z - 0.25,
  w: p.h * 0.52,
  d: p.h * 0.23,
}));
export function createRestSpots() {
  let current = null;
  return {
    active: () => !!current,
    start(id, origin, time) {
      const spot = restSpots.find((s) => s.id === id);
      if (!spot || current) return null;
      current = { ...spot, origin: { ...origin }, started: time };
      return current;
    },
    stop() {
      const origin = current?.origin;
      current = null;
      return origin;
    },
    snapshot(time) {
      return current
        ? {
            ...current,
            rock:
              current.id === "seahorse-rocker"
                ? Math.sin((time - current.started) / 430) * 0.065
                : 0,
          }
        : null;
    },
  };
}
