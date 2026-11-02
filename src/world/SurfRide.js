import { shoreline, beachOutline, isSand, isBeachLand } from "./Coast";
import { craftWater, oceanRoute, waterRoute } from "./Harbor";
import { movementDirection } from "./animation";
const smooth = (t) => t * t * (3 - 2 * t);
export const surfboard = {
  id: "surfboard",
  name: "Surfboard",
  title: "Surfboard",
  icon: "surfboard",
  art: "surfboard",
  x: 20,
  z: 22,
  h: 2.4,
};
const launch = { x: surfboard.x, z: shoreline(surfboard.x) + 2 };
// Shared shoreline samples pair a dry landing with an approach in open water.
// The pier is excluded: landing never crosses its fence or a boat's berth.
const shores = beachOutline
  .filter((_, i) => i % 3 === 0)
  .flatMap((p) => {
    if (Math.abs(p.x) < 4 && p.z > 20) return [];
    const d = Math.hypot(p.x, p.z + 4),
      dx = p.x / d,
      dz = (p.z + 4) / d;
    return [
      {
        land: { x: p.x - dx * 0.65, z: p.z - dz * 0.65 },
        water: { x: p.x + dx * 1.8, z: p.z + dz * 1.8 },
      },
    ];
  });
// The board is a manual rental. Reaching any safe beach ends the ride there;
// only the parked board returns to its rack. There is no scripted return lap.
export function createSurfRide(canLand = (p) => isSand(p.x, p.z)) {
  let ride = null,
    last = null;
  const safeShore = (s) =>
    canLand(s.land) && craftWater(s.water.x, s.water.z, "surfboard");
  function targetPath(target) {
    const path = oceanRoute(ride, target, "surfboard");
    return path ? waterRoute(path, "surfboard").points.slice(1) : null;
  }
  function stepAshore(shore, time) {
    ride.phase = "stepping";
    ride.started = time;
    ride.from = { x: ride.x, z: ride.z };
    ride.landing = shore.land;
    ride.targets = [];
    ride.direction = movementDirection(
      shore.land.x - ride.x,
      shore.land.z - ride.z,
    );
  }
  return {
    active: () => !!ride,
    manual: () => ride?.phase === "riding",
    snapshot: () => last,
    start(origin, time) {
      if (ride) return false;
      ride = {
        ...surfboard,
        origin: { ...origin },
        started: time,
        phase: "launching",
        direction: 0,
        targets: [],
        exit: null,
        trickStarted: -Infinity,
      };
      last = { ...ride, time: 0, moving: true, wave: 0 };
      return true;
    },
    steer(target) {
      if (ride?.phase !== "riding") return false;
      if (isBeachLand(target.x, target.z)) {
        const ordered = shores
          .filter(safeShore)
          .sort(
            (a, b) =>
              Math.hypot(a.land.x - target.x, a.land.z - target.z) -
              Math.hypot(b.land.x - target.x, b.land.z - target.z),
          );
        // A blocked first approach can be bypassed by the next nearby shore.
        for (const shore of ordered.slice(0, 12)) {
          const path = targetPath(shore.water);
          if (path) {
            ride.targets = path;
            ride.exit = shore;
            return true;
          }
        }
        return false;
      }
      if (!craftWater(target.x, target.z, "surfboard")) return false;
      const path = targetPath(target);
      if (!path) return false;
      ride.targets = path;
      ride.exit = null;
      return true;
    },
    stop() {
      if (ride?.phase === "riding") {
        ride.targets = [];
        ride.exit = null;
      }
    },
    trick(time) {
      if (ride?.phase !== "riding" || time - ride.trickStarted < 1400)
        return false;
      ride.trickStarted = time;
      return true;
    },
    update(dt, time, input = { x: 0, z: 0 }) {
      if (!ride) return last;
      let moving = false;
      if (ride.phase !== "riding") {
        const stepping = ride.phase === "stepping",
          t = Math.min(1, (time - ride.started) / (stepping ? 420 : 1200));
        const a = stepping ? ride.from : surfboard,
          b = stepping ? ride.landing : launch;
        ride.x = a.x + (b.x - a.x) * smooth(t);
        ride.z = a.z + (b.z - a.z) * smooth(t);
        moving = t < 1;
        if (t >= 1) {
          if (stepping) {
            last = {
              x: ride.landing.x,
              z: ride.landing.z,
              done: true,
              phase: "finished",
              moving: false,
              direction: ride.direction,
            };
            ride = null;
            return last;
          }
          ride.phase = "riding";
        }
      } else {
        let remaining = Math.min(dt, 0.1);
        while (remaining > 0 && ride.phase === "riding") {
          const step = Math.min(remaining, 1 / 60);
          remaining -= step;
          let dx = 0,
            dz = 0;
          const manual = Math.hypot(input.x, input.z) > 0;
          if (manual) {
            ride.targets = [];
            ride.exit = null;
            const length = Math.hypot(input.x, input.z);
            dx = input.x / length;
            dz = input.z / length;
            // Start a short, continuous step through the waterline only when
            // steering toward nearby dry sand, never from distant open water.
            const current = { x: ride.x, z: ride.z };
            const shore = shores
              .filter(
                (s) =>
                  Math.hypot(s.land.x - current.x, s.land.z - current.z) <
                    2.8 &&
                  safeShore(s) &&
                  (s.land.x - current.x) * dx + (s.land.z - current.z) * dz >
                    0.72 *
                      Math.hypot(s.land.x - current.x, s.land.z - current.z),
              )
              .sort(
                (a, b) =>
                  Math.hypot(a.land.x - current.x, a.land.z - current.z) -
                  Math.hypot(b.land.x - current.x, b.land.z - current.z),
              )[0];
            if (shore) {
              stepAshore(shore, time);
              break;
            }
          } else if (ride.targets.length) {
            const to = ride.targets[0],
              length = Math.hypot(to.x - ride.x, to.z - ride.z);
            if (length < 0.18) {
              ride.targets.shift();
              continue;
            }
            dx = (to.x - ride.x) / length;
            dz = (to.z - ride.z) / length;
          }
          const distance = 10 * step,
            before = { x: ride.x, z: ride.z };
          if (craftWater(ride.x + dx * distance, ride.z, "surfboard"))
            ride.x += dx * distance;
          if (craftWater(ride.x, ride.z + dz * distance, "surfboard"))
            ride.z += dz * distance;
          if (Math.hypot(ride.x - before.x, ride.z - before.z) > 0.001) {
            moving = true;
            ride.direction = movementDirection(dx, dz);
          } else if (!manual) ride.targets = [];
        }
        if (ride.phase === "riding" && ride.exit && !ride.targets.length) {
          // An interrupted route must never teleport to its original target.
          if (
            Math.hypot(ride.x - ride.exit.water.x, ride.z - ride.exit.water.z) <
            0.3
          )
            stepAshore(ride.exit, time);
          else ride.exit = null;
        }
      }
      const trick = Math.max(0, (time - ride.trickStarted) / 850);
      last = {
        x: ride.x,
        z: ride.z,
        direction: ride.direction,
        phase: ride.phase,
        moving,
        wave: moving && ride.phase === "riding" ? 0.75 : 0,
        time,
        lift:
          trick < 1 && ride.phase === "riding"
            ? Math.sin(trick * Math.PI) * 0.55
            : 0,
      };
      return last;
    },
    cancel() {
      const origin = ride?.origin;
      ride = null;
      last = null;
      return origin;
    },
  };
}
// A dedicated painted foam cycle follows the board's heading. Its alpha fades
// naturally into the ocean; the old solid crescent/oval water effect is gone.
export function drawSurfWave(ctx, at, unit, ride, image, sheet) {
  if (!ride || ride.wave <= 0 || !image || !sheet) return;
  const p = at(ride.x, ride.z),
    frame = Math.floor(ride.time / sheet.frameMs) % sheet.columns;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((-ride.direction * Math.PI) / 4);
  ctx.globalAlpha = 0.8;
  ctx.drawImage(
    image,
    frame * sheet.cw,
    0,
    sheet.cw,
    sheet.ch,
    -unit * 0.7,
    -unit * 2.15,
    unit * 1.4,
    unit * 2.8,
  );
  ctx.restore();
}
