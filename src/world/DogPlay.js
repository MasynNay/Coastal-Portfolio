import { canStand } from "./navigation";
import { obstacles } from "./config";
import {
  animalPath as pathPoints,
  pathLength as length,
  sampleAnimalPath as sampleDogPath,
} from "./AnimalPaths";
export { sampleDogPath };
// Activities have one owner and advance on the world clock. No detached timeouts
// survive travel, a room change or disposal. Paths use the same walls/water as walking.
export function createDogPlay(random = Math.random) {
  let activity = null,
    last = null;
  const settled = new Map();
  function clear() {
    activity = null;
    last = null;
  }
  return {
    start(id, kind, player, dog) {
      last = null;
      if (!dog || !["fetch", "walk", "pet"].includes(kind)) return false;
      const origin = {
          ...player,
        },
        startDog = {
          x: dog.x,
          z: dog.z,
        };
      if (kind === "pet") {
        activity = {
          id,
          kind,
          elapsed: 0,
          origin,
          startDog,
          total: 1400,
        };
        return true;
      }
      const candidates = Array.from(
        {
          length: 16,
        },
        (_, i) => {
          const a = (i / 16 + random() * 0.12) * Math.PI * 2,
            r = 3 + random() * 2;
          return {
            x: origin.x + Math.sin(a) * r,
            z: origin.z + Math.cos(a) * r,
          };
        },
      ).filter((p) => canStand(p.x, p.z, obstacles));
      if (kind === "fetch") {
        for (const ball of candidates) {
          const out = pathPoints(startDog, ball),
            back = pathPoints(ball, origin);
          if (!out || !back) continue;
          const outMs = Math.max(350, (length(out) / 11) * 1000),
            backMs = Math.max(350, (length(back) / 11) * 1000);
          activity = {
            id,
            kind,
            elapsed: 0,
            origin,
            startDog,
            ball,
            out,
            back,
            outMs,
            backMs,
            total: 650 + outMs + 300 + backMs,
          };
          return true;
        }
      } else {
        for (let i = 0; i < candidates.length - 1; i++) {
          const a = pathPoints(origin, candidates[i]),
            b = pathPoints(candidates[i], candidates[i + 1]),
            c = pathPoints(candidates[i + 1], origin);
          if (!a || !b || !c) continue;
          const route = [...a, ...b.slice(1), ...c.slice(1)];
          if (length(route) > 35) continue;
          activity = {
            id,
            kind,
            elapsed: 0,
            origin,
            startDog,
            route,
            total: 5000,
          };
          return true;
        }
      }
      // In a very tight spot a short, safe stroll still returns in five seconds.
      if (kind === "walk") {
        activity = {
          id,
          kind,
          elapsed: 0,
          origin,
          startDog,
          route: [origin, origin],
          total: 5000,
        };
        return true;
      }
      return false;
    },
    update(dt, time = 0) {
      if (!activity) return null;
      const a = activity;
      a.elapsed = Math.min(a.total, a.elapsed + dt * 1000);
      let player = {
          ...a.origin,
        },
        dog = {
          ...a.startDog,
        },
        ball = null;
      if (a.kind === "walk") {
        player = sampleDogPath(a.route, a.elapsed / 5000);
        const trail = sampleDogPath(
          a.route,
          Math.max(0, a.elapsed / 5000 - 0.8 / Math.max(1, length(a.route))),
        );
        const blend = Math.min(1, a.elapsed / 400);
        dog = {
          x: a.startDog.x + (trail.x - a.startDog.x) * blend,
          z: a.startDog.z + (trail.z - a.startDog.z) * blend,
          direction: trail.direction,
          moving: true,
        };
      } else if (a.kind === "fetch") {
        if (a.elapsed < 650) {
          const t = a.elapsed / 650;
          ball = {
            x: a.origin.x + (a.ball.x - a.origin.x) * t,
            z: a.origin.z + (a.ball.z - a.origin.z) * t,
            lift: Math.sin(t * Math.PI) * 2,
          };
        } else if (a.elapsed < 650 + a.outMs) {
          dog = {
            ...sampleDogPath(a.out, (a.elapsed - 650) / a.outMs),
            moving: true,
          };
          ball = {
            ...a.ball,
            lift: 0,
          };
        } else if (a.elapsed < 950 + a.outMs) {
          dog = {
            ...a.ball,
            moving: false,
          };
          ball = {
            ...a.ball,
            lift: 0,
          };
        } else {
          dog = {
            ...sampleDogPath(a.back, (a.elapsed - 950 - a.outMs) / a.backMs),
            moving: true,
          };
          ball = {
            x: dog.x,
            z: dog.z,
            lift: 0.32,
          };
        }
      }
      const done = a.elapsed >= a.total;
      if (done) {
        player = {
          ...a.origin,
        };
        dog.moving = false;
        settled.set(a.id, {
          x: dog.x,
          z: dog.z,
          at: time,
        });
      }
      last = {
        id: a.id,
        kind: a.kind,
        time,
        player,
        dog,
        ball: done ? null : ball,
        leash: a.kind === "walk" && !done,
        hearts: a.kind === "pet" && !done,
        done,
      };
      if (done) activity = null;
      return last;
    },
    snapshot() {
      return last;
    },
    active() {
      return !!activity;
    },
    settled() {
      return settled;
    },
    cancel() {
      if (last)
        settled.set(last.id, {
          x: last.dog.x,
          z: last.dog.z,
          at: last.time,
        });
      clear();
    },
  };
}
