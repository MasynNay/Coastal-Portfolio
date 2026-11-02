import { conductFrame } from "./WindStatue";
import sheets from "./SpriteSheets.json";
import { glideDurationMs } from "./Glide";
// One definition feeds the Q button, engine timing, action sprites and effects.
// Outfit actions briefly plant Masyn's feet; held movement resumes afterward.
const costumeAbilities = {
  home: {
    kind: "glide",
    label: "Glider",
    verb: "Glide in a circle",
    duration: glideDurationMs,
  },
  lodge: {
    kind: "ocarina",
    label: "Ocarina",
    verb: "Play ocarina",
    duration: 2200,
    cuts: [200, 400, 1800],
  },
  contact: {
    kind: "trident",
    label: "Trident",
    verb: "Throw trident",
    duration: 1500,
    cuts: [280, 650, 1150],
  },
  resume: {
    kind: "spell",
    label: "Wand",
    verb: "Cast a spell",
    duration: 1500,
    cuts: [280, 550, 1100],
  },
  portfolio: {
    kind: "pokeball",
    label: "Poké Ball",
    verb: "Throw Poké Ball",
    duration: 1300,
    cuts: [240, 480, 900],
  },
  skills: {
    kind: "arrow",
    label: "Bow",
    verb: "Shoot an arrow",
    duration: 1300,
    cuts: [250, 550, 900],
  },
};
export function characterAbility(character, outfit, surfing = false) {
  if (character === "masyn" && outfit === "panem")
    return {
      kind: "salute",
      label: "Salute",
      verb: "Raise a three-finger salute",
      asset: "costume-panem-salute",
      duration: 3000,
    };
  if (["ezra", "fitzgerald"].includes(character))
    return { kind: "web", label: "Web", verb: "Shoot web" };
  if (character === "fallyn")
    return {
      kind: "yoyo",
      label: "Yo-yo",
      verb: "Throw yo-yo",
      duration: 1100,
    };
  if (character === "mi-shell" && !surfing)
    return {
      kind: "money",
      label: "Spending money",
      verb: "Throw dollar bills",
      asset: "ability-money",
      duration: 1700,
      cuts: [250, 500, 1250],
    };
  if (character !== "masyn" || surfing) return null;
  const ability = costumeAbilities[outfit];
  return ability ? { ...ability, asset: "ability-" + ability.kind } : null;
}
export function abilityActive(effect, time) {
  return (
    !!effect &&
    time >= effect.started &&
    time - effect.started < effect.duration
  );
}
export function abilityLocksMovement(effect, time) {
  return abilityActive(effect, time) && !!effect.asset;
}
export function startAbility(actor, time) {
  const ability = characterAbility(actor.id, actor.outfit, actor.surfing);
  if (!ability || ability.kind === "web") return null;
  const angle = (actor.direction * Math.PI) / 4;
  return {
    ...ability,
    x: actor.x,
    z: actor.z,
    dx: Math.sin(angle),
    dz: Math.cos(angle),
    direction: actor.direction,
    started: time,
  };
}
export function abilityColumn(effect, time) {
  if (effect.kind === "conduct") return conductFrame(time - effect.started);
  const age = Math.max(0, time - effect.started);
  const stage = effect.cuts?.filter((cut) => age >= cut).length || 0;
  const columns = sheets[effect.asset]?.columns || 4;
  if (columns <= 4 || !effect.cuts) return stage;
  const boundaries = [0, ...effect.cuts, effect.duration];
  const progress =
    (age - boundaries[stage]) / (boundaries[stage + 1] - boundaries[stage]);
  return Math.min(columns - 1, stage * 2 + (progress >= 0.5 ? 1 : 0));
}
// Projectile positions are independent of the render rate. The trident makes
// one out-and-back trip and meets the hand exactly when its return pose starts.
export function abilityProjectile(effect, time) {
  if (!abilityActive(effect, time)) return null;
  const windows = {
    trident: [280, 1150],
    pokeball: [480, 1130],
    arrow: [550, 1050],
  };
  const window = windows[effect.kind];
  if (!window) return null;
  const t = (time - effect.started - window[0]) / (window[1] - window[0]);
  if (t < 0 || t >= 1) return null;
  const distance =
    0.55 +
    (effect.kind === "trident"
      ? Math.sin(t * Math.PI) * 3.6
      : t *
        (effect.target ? Math.max(0.1, effect.target.distance - 0.55) : 4.8));
  return {
    kind: effect.kind,
    x: effect.x + effect.dx * distance,
    z: effect.z + effect.dz * distance,
    t,
    lift:
      effect.kind === "pokeball"
        ? Math.sin(t * Math.PI) * 1.3
        : effect.kind === "arrow" && effect.target
          ? t * 1.05
          : 0,
    alpha: effect.kind === "trident" ? 1 : Math.min(1, (1 - t) * 5),
  };
}
