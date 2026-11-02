import { obstacles } from "./config";
import { canStand, findPath } from "./navigation";
import { smoothPath, roundPath } from "./Paths";
import { movementDirection } from "./animation";
import fit from "./BikeFit.json";

export const bikeHeight = fit.worldHeight;

export const bikes = [
  {
    id: "acro",
    name: "Acro bike",
    art: "bike-acro",
    x: 26.1,
    z: -5.3,
    speed: 10.5,
  },
  {
    id: "mach",
    name: "Mach bike",
    art: "bike-mach",
    x: 26.1,
    z: -0.3,
    speed: 13,
  },
];
const blend = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  z: a.z + (b.z - a.z) * t,
});
const ease = (t) => t * t * (3 - 2 * t);

function routeFor(bike) {
  const other = bikes.find((b) => b.id !== bike.id);
  // A parked bicycle has its own clearance, so the guided route cannot ride
  // through the other rental. Parallel inset/outset pond lanes let the two
  // bicycles circulate in opposite directions without sharing a centerline.
  const blockers = [...obstacles, { x: other.x, z: other.z, radius: 2.3 }];
  const lane = bike.id === "acro" ? 0.7 : -0.7;
  const topRight = { x: 8.75 - lane, z: -11 + lane },
    bottomRight = { x: 8.75 - lane, z: 7 - lane },
    topLeft = { x: -8.25 + lane, z: -11 + lane },
    bottomLeft = { x: -8.25 + lane, z: 7 - lane };
  const loop =
    bike.id === "acro"
      ? [topRight, topLeft, bottomLeft, bottomRight, topRight]
      : [bottomRight, bottomLeft, topLeft, topRight, bottomRight];
  const waypoints = [...loop, { x: 25, z: bike.z }, bike];
  const points = [{ x: bike.x, z: bike.z }];
  let current = points[0];
  for (const target of waypoints) {
    const path = findPath(current, target, blockers);
    if (
      !path.length &&
      Math.hypot(current.x - target.x, current.z - target.z) > 0.8
    )
      return null;
    const short = smoothPath(current, path, blockers);
    points.push(...short);
    const last = points[points.length - 1];
    if (canStand(target.x, target.z, blockers))
      points.push({ x: target.x, z: target.z });
    current = points[points.length - 1] || last;
  }
  const rounded = roundPath(points, blockers),
    distances = [0];
  for (let i = 1; i < rounded.length; i++)
    distances.push(
      distances[i - 1] +
        Math.hypot(
          rounded[i].x - rounded[i - 1].x,
          rounded[i].z - rounded[i - 1].z,
        ),
    );
  return {
    points: rounded,
    distances,
    length: distances[distances.length - 1],
    blockers,
  };
}
function pointAt(route, distance) {
  const { points, distances } = route;
  let lo = 1,
    hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (distances[mid] < distance) lo = mid + 1;
    else hi = mid;
  }
  const a = points[lo - 1],
    b = points[lo],
    length = distances[lo] - distances[lo - 1];
  return {
    ...blend(
      a,
      b,
      Math.min(1, Math.max(0, (distance - distances[lo - 1]) / (length || 1))),
    ),
    direction: movementDirection(b.x - a.x, b.z - a.z),
  };
}

// This activity owns one route and one rider. It uses the paused world clock,
// keeps the bike/rider together, and leaves the underlying outfit untouched.
export function createBikeRide() {
  let ride = null,
    snapshot = null;
  const parking = { acro: 6, mach: 6 };
  return {
    start(id, origin, time) {
      if (ride) return false;
      const bike = bikes.find((b) => b.id === id);
      if (!bike) return false;
      const route = routeFor(bike);
      if (!route) return false;
      const seconds = route.length / bike.speed + 0.6;
      ride = { bike, route, origin: { ...origin }, started: time, seconds };
      snapshot = {
        id,
        phase: "mounting",
        ...origin,
        direction: parking[id],
        moving: false,
        time: 0,
      };
      return true;
    },
    update(time) {
      if (!ride) return null;
      const { bike, route, origin, started, seconds } = ride,
        elapsed = (time - started) / 1000;
      if (elapsed < 0.45)
        snapshot = {
          id: bike.id,
          phase: "mounting",
          ...blend(origin, bike, ease(Math.max(0, elapsed / 0.45))),
          direction: movementDirection(bike.x - origin.x, bike.z - origin.z),
          moving: true,
          time: elapsed * 1000,
        };
      else if (elapsed < seconds + 0.45) {
        const t = elapsed - 0.45,
          ramp = 0.6;
        const distance =
          t < ramp
            ? (bike.speed * t * t) / (2 * ramp)
            : t > seconds - ramp
              ? route.length - (bike.speed * (seconds - t) ** 2) / (2 * ramp)
              : bike.speed * (t - ramp / 2);
        snapshot = {
          id: bike.id,
          phase: "riding",
          ...pointAt(route, distance),
          moving: true,
          time: distance * 75,
        };
      } else if (elapsed < seconds + 0.95) {
        const t = (elapsed - seconds - 0.45) / 0.5;
        parking[bike.id] = pointAt(route, route.length).direction;
        snapshot = {
          id: bike.id,
          phase: "dismounting",
          ...blend(bike, origin, ease(t)),
          direction: movementDirection(origin.x - bike.x, origin.z - bike.z),
          moving: true,
          time: t * 500,
        };
      } else {
        snapshot = {
          id: bike.id,
          phase: "done",
          ...origin,
          direction: parking[bike.id],
          moving: false,
          time: 0,
          done: true,
        };
        ride = null;
      }
      return snapshot;
    },
    active: () => !!ride,
    snapshot: () => snapshot,
    parking: () => parking,
    cancel() {
      const origin = ride?.origin;
      ride = null;
      snapshot = null;
      return origin;
    },
  };
}
