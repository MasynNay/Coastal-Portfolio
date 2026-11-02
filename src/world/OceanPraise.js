// A short, cosmetic Ocean King surprise. It uses the paused world clock and
// never adds these visiting fish to the player's collection.
export function createOceanPraise() {
  let started = -Infinity,
    center = null;
  return {
    summon(actor, time) {
      if (
        actor.kind !== "trident" ||
        actor.room ||
        actor.surfing ||
        Math.abs(actor.x) > 2.9 ||
        actor.z < 23 ||
        actor.z > 32 ||
        (Math.abs(actor.x) < 1.6 && actor.z < 30)
      )
        return false;
      started = time;
      center =
        actor.z > 30
          ? { x: 0, z: 35 }
          : { x: actor.x < 0 ? -9 : 9, z: actor.z + 1 };
      return true;
    },
    snapshot(time) {
      const age = time - started;
      if (!center || age < 350 || age > 4800) return null;
      const fade = Math.min(1, (age - 350) / 400, (4800 - age) / 600);
      return { ...center, age, fade, speaking: age > 1000 && age < 4300 };
    },
    cancel() {
      center = null;
    },
  };
}
