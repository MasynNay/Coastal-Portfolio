import sheets from "./SpriteSheets.json";
import appearances from "./Appearances.json";
// The character picker, abilities and artwork exporters share one identity list.
export const heroOutfits = appearances
  .filter((o) => o.hero)
  .map((o) => ({
    ...o,
    available: !!sheets[o.asset],
  }));
function random(seed) {
  const n = Math.sin(seed * 91.731 + 47.17) * 43758.5453;
  return n - Math.floor(n);
}
// Seeded windows vary from cycle to cycle, but never re-roll on every frame.
export function npcCostume(character, time) {
  const index = heroOutfits.findIndex((o) => o.character === character);
  if (index < 0 || !heroOutfits[index].available) return null;
  const seconds = time / 1000 + index * 19 + 9,
    cycle = Math.floor(seconds / 72),
    phase = seconds % 72;
  const start = 14 + random(cycle + index * 37) * 18,
    duration = 14 + random(cycle + index * 53 + 11) * 12;
  return phase >= start && phase < start + duration
    ? heroOutfits[index].id
    : null;
}
export function shootsWebs(character, outfit) {
  return heroOutfits.some(
    (o) =>
      o.available && o.character === character && o.id === outfit && o.webs,
  );
}
export function createWebs() {
  const next = new Map();
  let effects = [];
  const manual = new Map();
  function emit(a, time) {
    const angle = ((a.direction || 0) * Math.PI) / 4;
    effects.push({
      id: a.id,
      x: a.x,
      z: a.z,
      dx: Math.sin(angle),
      dz: Math.cos(angle),
      started: time,
    });
  }
  return {
    shoot(a, time) {
      if (
        !["ezra", "fitzgerald"].includes(a.id) ||
        time - (manual.get(a.id) ?? -1000) < 400
      )
        return false;
      manual.set(a.id, time);
      emit(a, time);
      return true;
    },
    update(actors, time) {
      const present = new Set();
      for (const a of actors) {
        if (!shootsWebs(a.id, a.outfit)) continue;
        present.add(a.id);
        if (!next.has(a.id)) next.set(a.id, time + 15000);
        if (time >= next.get(a.id)) {
          emit(a, time);
          next.set(a.id, time + 15000);
        }
      }
      for (const id of next.keys()) if (!present.has(id)) next.delete(id);
      effects = effects.filter((e) => time - e.started < 1000);
      return effects;
    },
    clear() {
      next.clear();
      manual.clear();
      effects = [];
    },
  };
}
