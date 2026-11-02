import {
  watercraft,
  islandLap,
  craftWater,
  oceanRoute,
  waterRoute,
  sampleWaterRoute,
} from "./Harbor";
import { movementDirection } from "./animation";

// One rider at a time, using the pauseable world clock. A ride always remembers
// its exact origin and surf state so cancel/travel/character changes are safe.
export function createWaterRide() {
  let ride = null,
    snapshot = null;
  function guided(points, time, returning = false) {
    const route = waterRoute(points, ride.craft.id);
    ride.towStart = snapshot?.wakeboarder || { x: -8, z: 27 };
    // On early return, the tow rope may cut diagonally across a new beach
    // corner. Give the rider a water-safe approach instead of a straight chord.
    const approach = oceanRoute(ride.towStart, route.points[0], ride.craft.id);
    ride.towRoute = waterRoute(
      approach || [ride.towStart, route.points[0]],
      ride.craft.id,
    );
    ride.route = route;
    ride.started = time;
    ride.duration = route.length / ride.craft.speed + 0.6;
    ride.returning = returning;
    ride.target = null;
    ride.targets = [];
  }
  return {
    start(id, origin, surfing, time, guest = null, controlled = "masyn") {
      if (ride) return false;
      const craft = watercraft.find((c) => c.id === id);
      if (!craft || (id === "boat" && !guest)) return false;
      ride = {
        craft,
        id,
        wakeboarding: id === "boat",
        controlled,
        guest,
        origin: { ...origin },
        surfing,
        x: craft.x,
        z: craft.z,
        direction: 0,
        started: time,
        trickStarted: -Infinity,
        tricks: 0,
        target: null,
      };
      if (id === "boat") guided(islandLap, time);
      snapshot = {
        id,
        craftId: craft.id,
        wakeboarding: id === "boat",
        driver: id === "boat" ? guest : controlled,
        wakeboarder:
          id === "boat"
            ? { id: controlled, x: -8, z: 27, direction: 0, lift: 0, spin: 0 }
            : null,
        phase: "riding",
        x: craft.x,
        z: craft.z,
        direction: 0,
        moving: false,
        time: 0,
        lift: 0,
        spin: 0,
      };
      return true;
    },
    active: () => !!ride,
    id: () => ride?.id,
    snapshot: () => snapshot,
    steer(target) {
      if (
        ride?.craft.id === "jetski" &&
        !ride.route &&
        craftWater(target.x, target.z, "jetski")
      ) {
        const path = oceanRoute(ride, target, "jetski");
        if (!path) return false;
        ride.targets = waterRoute(path, "jetski").points.slice(1);
        ride.target = ride.targets.shift();
        return true;
      }
      return false;
    },
    stop() {
      if (ride && !ride.route) {
        ride.target = null;
        ride.targets = [];
      }
    },
    trick(time) {
      if (
        !ride ||
        !["jetski", "boat"].includes(ride.id) ||
        ride.returning ||
        time - ride.trickStarted < 1800
      )
        return false;
      ride.trickStarted = time;
      ride.tricks++;
      return true;
    },
    return(time) {
      if (!ride) return false;
      if (ride.returning) return true;
      const points = oceanRoute(ride, ride.craft, ride.craft.id);
      if (!points) return false;
      guided(points, time, true);
      return true;
    },
    update(dt, time, input = { x: 0, z: 0 }) {
      if (!ride) return null;
      let moving = false,
        wakeboarder = null;
      if (ride.route) {
        const age = Math.max(0, (time - ride.started) / 1000),
          duration = ride.duration,
          speed = ride.craft.speed;
        if (age >= duration) {
          snapshot = {
            ...ride.origin,
            id: ride.id,
            craftId: ride.craft.id,
            phase: "done",
            done: true,
            surfing: ride.surfing,
            direction: 0,
            moving: false,
            time: 0,
            lift: 0,
            spin: 0,
          };
          ride = null;
          return snapshot;
        }
        const distance =
          age < 0.6
            ? (speed * age * age) / 1.2
            : age > duration - 0.6
              ? ride.route.length - (speed * (duration - age) ** 2) / 1.2
              : speed * (age - 0.3);
        const p = sampleWaterRoute(ride.route, distance);
        ride.x = p.x;
        ride.z = p.z;
        ride.direction = movementDirection(p.dx, p.dz);
        moving = true;
        if (ride.craft.id === "boat" && ride.guest && ride.wakeboarding) {
          const sampled = sampleWaterRoute(
            ride.route,
            Math.max(0, distance - 5.5),
          );
          const t = Math.min(1, distance / 5.5),
            approachLength = ride.towRoute.length;
          const p =
            distance < 5.5
              ? sampleWaterRoute(ride.towRoute, t * approachLength)
              : sampled;
          const manual = (time - ride.trickStarted) / 1100;
          const flip =
            manual >= 0 && manual < 1
              ? manual
              : ((time - ride.started - 3500) % 8000) / 1100;
          wakeboarder = {
            id: ride.id === "boat" ? ride.controlled : ride.guest,
            x: p.x,
            z: p.z,
            direction: movementDirection(p.dx, p.dz),
            lift: flip >= 0 && flip < 1 ? Math.sin(flip * Math.PI) * 2 : 0,
            trickProgress: flip >= 0 && flip < 1 ? flip : null,
            spin: flip >= 0 && flip < 1 ? flip * Math.PI * 2 : 0,
          };
        }
      } else {
        let dx = input.x,
          dz = input.z;
        if (dx || dz) {
          ride.target = null;
          ride.targets = [];
        } else if (ride.target) {
          while (
            ride.target &&
            Math.hypot(ride.target.x - ride.x, ride.target.z - ride.z) < 0.25
          )
            ride.target = ride.targets.shift();
          if (ride.target) {
            dx = ride.target.x - ride.x;
            dz = ride.target.z - ride.z;
          }
        }
        const length = Math.hypot(dx, dz);
        if (length) {
          const distance = Math.min(
              ride.craft.speed * dt,
              ride.target ? length : Infinity,
            ),
            steps = Math.max(1, Math.ceil(distance / 0.15));
          const x = ride.x,
            z = ride.z;
          for (let i = 0; i < steps; i++) {
            const nx = ride.x + ((dx / length) * distance) / steps,
              nz = ride.z + ((dz / length) * distance) / steps;
            if (craftWater(nx, ride.z, ride.craft.id)) ride.x = nx;
            if (craftWater(ride.x, nz, ride.craft.id)) ride.z = nz;
          }
          moving = Math.hypot(ride.x - x, ride.z - z) > 0.0001;
          if (moving)
            ride.direction = movementDirection(ride.x - x, ride.z - z);
          else {
            ride.target = null;
            ride.targets = [];
          }
        }
      }
      const trick = (time - ride.trickStarted) / 900,
        airborne = trick >= 0 && trick < 1;
      snapshot = {
        id: ride.id,
        craftId: ride.craft.id,
        wakeboarding: ride.wakeboarding,
        driver: ride.id === "boat" ? ride.guest : ride.controlled,
        wakeboarder,
        phase: ride.returning ? "returning" : "riding",
        x: ride.x,
        z: ride.z,
        direction: ride.direction,
        moving,
        time,
        lift:
          ride.id === "jetski" && airborne
            ? Math.sin(trick * Math.PI) * 1.5
            : 0,
        spin:
          ride.id === "jetski" && airborne && ride.tricks % 2 === 0
            ? trick * Math.PI * 2
            : 0,
        splash: trick >= 1 && trick < 1.6 ? (trick - 1) / 0.6 : null,
        trick:
          ride.id === "boat"
            ? wakeboarder?.trickProgress != null
              ? "Wakeboard flip!"
              : null
            : airborne
              ? ride.tricks % 2
                ? "Hop!"
                : "360 spin!"
              : null,
      };
      return snapshot;
    },
    cancel() {
      if (!ride) {
        snapshot = null;
        return null;
      }
      const origin = { ...ride.origin, surfing: ride.surfing };
      ride = null;
      snapshot = null;
      return origin;
    },
  };
}
