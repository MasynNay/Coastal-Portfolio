import { isSand } from "./Coast";
export const beachStations = [
  {
    id: "sandcastle",
    type: "sandcastle",
    x: -12,
    z: 22,
    h: 1.4,
    label: "Build a sandcastle",
  },
  {
    id: "kite",
    type: "kite",
    x: 12,
    z: 22,
    h: 1,
    label: "Fly the dragon kite",
  },
];
// Uses the world's pauseable clock. Footprints are distance-spaced and capped,
// so a long beach visit cannot grow a per-frame history without a limit.
export function createBeachActivities() {
  let castle = 0,
    building = null,
    kite = null,
    footprints = [],
    lastStep = null,
    foot = 0;
  return {
    build(time) {
      building = { started: time };
      castle = 0;
    },
    busy: () => !!building,
    fly(time, direction = 0) {
      const angle = (direction * Math.PI) / 4;
      kite = {
        started: time,
        last: time,
        direction,
        dx: Math.sin(angle),
        dz: Math.cos(angle),
      };
    },
    cancel() {
      if (building) {
        building = null;
        castle = 0;
      }
      kite = null;
      lastStep = null;
    },
    animating: () => !!building || !!kite || footprints.length > 0,
    update(time, position, direction, walking) {
      footprints = footprints.filter((p) => time - p.time < 14000);
      if (walking && isSand(position.x, position.z)) {
        if (
          !lastStep ||
          Math.hypot(position.x - lastStep.x, position.z - lastStep.z) > 0.42
        ) {
          footprints.push({
            ...position,
            direction,
            side: foot++ % 2 ? 1 : -1,
            time,
          });
          if (footprints.length > 96) footprints.shift();
          lastStep = { ...position };
        }
      } else lastStep = null;
      if (kite && time - kite.started >= 16000) kite = null;
      if (kite) {
        const angle = (direction * Math.PI) / 4,
          blend = 1 - Math.exp(-Math.max(0, time - kite.last) / 180);
        kite.dx += (Math.sin(angle) - kite.dx) * blend;
        kite.dz += (Math.cos(angle) - kite.dz) * blend;
        kite.direction = direction;
        kite.last = time;
      }
      if (building) {
        castle = Math.min(1, (time - building.started) / 7000);
        if (castle >= 1) {
          building = null;
          return "Your sandcastle is finished!";
        }
      }
      return null;
    },
    snapshot(time) {
      return {
        castle,
        building: building
          ? {
              started: building.started,
              progress: Math.min(1, (time - building.started) / 7000),
            }
          : null,
        kite: kite ? { ...kite } : null,
        footprints,
      };
    },
  };
}
