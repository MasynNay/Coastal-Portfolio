import { movementDirection } from "./animation";
const duration = { spell: 2500, pokeball: 2800, arrow: 2400 };
export const passingDuration = 5600;
// An NPC's route clock pauses during a trick. Accumulated delays keep them at
// the same route position afterward, rather than teleporting to where time went.
export function createNpcTricks() {
  const delays = new Map();
  let effects = [],
    cycle = null;
  function settle(time) {
    for (const e of effects)
      if (time >= e.started + e.duration && !e.settled) {
        delays.set(e.id, (delays.get(e.id) || 0) + e.duration);
        e.settled = true;
      }
    effects = effects.filter((e) => !e.settled);
  }
  return {
    start(effect, actors, character, time, outside = true) {
      if (!effect || !outside) return effect;
      settle(time);
      if (effect.kind === "ocarina") {
        if (!cycle || time >= cycle.started + cycle.duration)
          cycle = { started: time, duration: passingDuration };
        return effect;
      }
      if (!duration[effect.kind]) return effect;
      const target = actors
        .filter(
          (a) =>
            a.id !== character &&
            !a.room &&
            !a.surfing &&
            !a.bike &&
            !a.outing &&
            !a.hidden &&
            !effects.some((e) => e.id === a.id),
        )
        .map((a) => ({
          ...a,
          distance: Math.hypot(a.x - effect.x, a.z - effect.z),
        }))
        .filter((a) => a.distance > 0.45 && a.distance < 3.4)
        .sort((a, b) => a.distance - b.distance)[0];
      if (!target) return effect;
      const dx = (target.x - effect.x) / target.distance,
        dz = (target.z - effect.z) / target.distance;
      effects.push({
        id: target.id,
        kind: effect.kind,
        x: target.x,
        z: target.z,
        started: time,
        duration: duration[effect.kind],
        direction: movementDirection(-dx, -dz),
      });
      return {
        ...effect,
        dx,
        dz,
        direction: movementDirection(dx, dz),
        target: {
          id: target.id,
          x: target.x,
          z: target.z,
          distance: target.distance,
        },
      };
    },
    actorTime(id, time) {
      settle(time);
      const e = effects.find((e) => e.id === id);
      return (
        time - (delays.get(id) || 0) - (e ? Math.max(0, time - e.started) : 0)
      );
    },
    snapshot(time) {
      settle(time);
      return effects.map((e) => ({ ...e, age: time - e.started }));
    },
    night(time) {
      if (!cycle) return 0;
      const t = (time - cycle.started) / cycle.duration;
      return t > 0 && t < 1 ? Math.pow(Math.sin(t * Math.PI), 1.5) : 0;
    },
    animating(time) {
      settle(time);
      return (
        effects.length > 0 || (!!cycle && time < cycle.started + cycle.duration)
      );
    },
    cancel(time) {
      settle(time);
      for (const e of effects)
        delays.set(
          e.id,
          (delays.get(e.id) || 0) + Math.max(0, time - e.started),
        );
      effects = [];
      cycle = null;
    },
    reset() {
      delays.clear();
      effects = [];
      cycle = null;
    },
  };
}
export function trickPose(actor, effect) {
  if (!effect) return actor;
  const frog =
    effect.kind === "spell" && effect.age >= 650 && effect.age < 1950;
  const hidden =
    effect.kind === "pokeball" && effect.age >= 1130 && effect.age < 2300;
  return {
    ...actor,
    x: effect.x,
    z: effect.z,
    direction: effect.direction,
    moving: false,
    trick: effect,
    frog,
    hidden,
  };
}
