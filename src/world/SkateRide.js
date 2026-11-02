import { obstacles } from "./config";
import { canStand, move, findPath } from "./navigation";
import { smoothPath, roundPath } from "./Paths";
import { movementDirection } from "./animation";

// The board stays on land and returns to its rack. Input and tricks share the
// same update, so jumping never cancels a held direction or touch destination.
export const skateboard = {
  id: "skateboard",
  name: "Skateboard",
  x: 26.1,
  z: 4.3,
  art: "skateboard",
  h: 0.85,
};
export function createSkateRide() {
  let ride = null,
    snapshot = null;
  const route = (start, end) => {
    if (!canStand(end.x, end.z, obstacles)) return null;
    const path = findPath(start, end, obstacles);
    if (!path.length && Math.hypot(start.x - end.x, start.z - end.z) > 0.8)
      return null;
    return roundPath(
      [start, ...smoothPath(start, path, obstacles), end],
      obstacles,
    ).slice(1);
  };
  return {
    active: () => !!ride,
    manual: () => !!ride && !ride.returning,
    snapshot: () => snapshot,
    start(origin, time) {
      if (ride || !canStand(skateboard.x, skateboard.z, obstacles))
        return false;
      ride = {
        ...skateboard,
        origin: { ...origin },
        direction: 2,
        targets: [],
        trickStarted: -Infinity,
        tricks: 0,
        gaitTime: 0,
      };
      snapshot = { ...ride, phase: "riding", time };
      return true;
    },
    steer(target) {
      if (!ride || ride.returning) return false;
      const path = route(ride, target);
      if (!path) return false;
      ride.targets = path;
      return true;
    },
    stop() {
      if (ride && !ride.returning) ride.targets = [];
    },
    trick(time) {
      if (!ride || ride.returning || time - ride.trickStarted < 1600)
        return false;
      ride.trickStarted = time;
      ride.tricks++;
      return true;
    },
    return() {
      if (!ride) return false;
      if (ride.returning) return true;
      const path = route(ride, skateboard);
      if (!path) return false;
      ride.targets = path;
      ride.returning = true;
      return true;
    },
    update(dt, time, input = { x: 0, z: 0 }) {
      if (!ride) return null;
      let dx = input.x,
        dz = input.z;
      if (ride.returning) dx = dz = 0;
      else if (dx || dz) ride.targets = [];
      while (
        ride.targets.length &&
        Math.hypot(ride.targets[0].x - ride.x, ride.targets[0].z - ride.z) <
          0.18
      )
        ride.targets.shift();
      if (!dx && !dz && ride.targets.length) {
        dx = ride.targets[0].x - ride.x;
        dz = ride.targets[0].z - ride.z;
      }
      const length = Math.hypot(dx, dz),
        old = { x: ride.x, z: ride.z };
      if (length) {
        const distance = Math.min(
          12 * dt,
          ride.targets.length ? length : Infinity,
        );
        const next = move(
          ride,
          (dx / length) * distance,
          (dz / length) * distance,
          obstacles,
          false,
        );
        ride.x = next.x;
        ride.z = next.z;
      }
      const moving = Math.hypot(ride.x - old.x, ride.z - old.z) > 0.0001;
      if (moving) {
        ride.direction = movementDirection(ride.x - old.x, ride.z - old.z);
        ride.gaitTime +=
          (Math.hypot(ride.x - old.x, ride.z - old.z) / 12) * 1000;
      }
      if (
        ride.returning &&
        Math.hypot(ride.x - skateboard.x, ride.z - skateboard.z) < 0.2
      ) {
        snapshot = {
          ...ride.origin,
          done: true,
          moving: false,
          direction: ride.direction,
          time,
        };
        ride = null;
        return snapshot;
      }
      const t = (time - ride.trickStarted) / 850,
        active = t >= 0 && t < 1,
        flight = (t - 0.22) / 0.5,
        airborne = active && flight >= 0 && flight < 1;
      snapshot = {
        x: ride.x,
        z: ride.z,
        direction: ride.direction,
        moving,
        time,
        gaitTime: ride.gaitTime,
        phase: ride.returning ? "returning" : "riding",
        trickProgress: active ? t : null,
        lift: airborne ? Math.sin(flight * Math.PI) * 0.75 : 0,
        spin: 0,
        deckFlip: airborne && ride.tricks % 2 === 0 ? flight * Math.PI * 2 : 0,
        trick: active ? (ride.tricks % 2 ? "Ollie!" : "Kickflip!") : null,
      };
      return snapshot;
    },
    cancel() {
      const origin = ride?.origin;
      ride = null;
      snapshot = null;
      return origin;
    },
  };
}
