import sheets from "./SpriteSheets.json";
import { movementDirection } from "./animation";

export const glideTakeoffMs = 650,
  glideLandingMs = 3250,
  glideDurationMs = 3900;
const ease = (t) => t * t * (3 - 2 * t);

function circle(effect, progress) {
  const theta = ease(progress) * Math.PI * 2,
    radius = effect.radius;
  const angle = effect.circleAngle,
    turn = effect.turn;
  const forward = { x: Math.sin(angle), z: Math.cos(angle) };
  const right = { x: Math.cos(angle) * turn, z: -Math.sin(angle) * turn };
  return {
    x:
      effect.x +
      radius * (right.x * (1 - Math.cos(theta)) + forward.x * Math.sin(theta)),
    z:
      effect.z +
      radius * (right.z * (1 - Math.cos(theta)) + forward.z * Math.sin(theta)),
    direction: movementDirection(
      right.x * Math.sin(theta) + forward.x * Math.cos(theta),
      right.z * Math.sin(theta) + forward.z * Math.cos(theta),
    ),
  };
}

// Plan the entire circle before takeoff. The same collision predicate used by
// walking prevents gliding through the new fence, a room wall or a building.
export function planGlide(effect, canVisit) {
  for (const radius of [1.6, 1.2, 0.8, 0.45])
    for (const facing of [0, -1, 1, -2, 2, -3, 3, 4])
      for (const turn of [1, -1]) {
        const candidate = {
          ...effect,
          radius,
          turn,
          circleAngle: ((effect.direction + facing) * Math.PI) / 4,
        };
        if (
          Array.from({ length: 65 }, (_, i) => circle(candidate, i / 64)).every(
            canVisit,
          )
        )
          return candidate;
      }
  return null;
}

// All phases use the paused world clock. Endpoints are exact, not an accumulated
// velocity, so finishing or cancelling always restores the original position.
export function glideVisual(effect, time) {
  if (
    effect?.kind !== "glide" ||
    !Number.isFinite(effect.circleAngle) ||
    !(effect.radius > 0) ||
    time < effect.started ||
    time >= effect.started + effect.duration
  )
    return null;
  const age = time - effect.started;
  const direction = movementDirection(
    Math.sin(effect.circleAngle),
    Math.cos(effect.circleAngle),
  );
  if (age < glideTakeoffMs)
    return {
      phase: "takeoff",
      asset: "glide-launch",
      frame: Math.min(
        (sheets["glide-launch"]?.columns || 4) - 1,
        Math.floor(
          age / (glideTakeoffMs / (sheets["glide-launch"]?.columns || 4)),
        ),
      ),
      x: effect.x,
      z: effect.z,
      direction,
      lift: 0.95 * ease(Math.max(0, (age - 250) / (glideTakeoffMs - 250))),
    };
  if (age < glideLandingMs)
    return {
      phase: "gliding",
      asset: "ability-glide",
      frame:
        Math.floor(
          (age - glideTakeoffMs) /
            (480 / (sheets["ability-glide"]?.columns || 4)),
        ) % (sheets["ability-glide"]?.columns || 4),
      ...circle(
        effect,
        (age - glideTakeoffMs) / (glideLandingMs - glideTakeoffMs),
      ),
      lift: 0.95 + Math.sin((age - glideTakeoffMs) / 350) * 0.04,
    };
  const t = (age - glideLandingMs) / (glideDurationMs - glideLandingMs);
  return {
    phase: "landing",
    asset: "glide-land",
    frame: Math.min(
      (sheets["glide-land"]?.columns || 4) - 1,
      Math.floor(t * (sheets["glide-land"]?.columns || 4)),
    ),
    x: effect.x,
    z: effect.z,
    direction,
    lift: 0.95 * (1 - ease(Math.min(1, t * 1.5))),
  };
}
