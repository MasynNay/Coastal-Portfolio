import { movementDirection } from "./animation";

export const groveTree = { x: -24, z: -23 };
export const groveInteraction = {
  id: "totoro-grove",
  type: "grove",
  label: "Dance with Totoro",
  x: -25.5,
  z: -21.1,
};

const spirits = [
  { x: -26.2, z: -22.25, h: 2.65 },
  { x: -27.05, z: -22.6, h: 1.85 },
  { x: -25.25, z: -22.05, h: 1.42 },
];
const cell = 144;
const gatherMs = 650;
const beatMs = 2100;
const stepMs = 900;
const reachMs = 1310;
const beatCount = 3;
const returnAt = gatherMs + beatMs * beatCount + 650;
const returnMs = 1300;
const duration = returnAt + returnMs;
const radiusX = 2.2;
const radiusZ = 1.65;
const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function groveDance(started, time) {
  const elapsed = time - started;
  if (started === null || elapsed >= duration) return null;

  const rhythm = Math.max(0, elapsed - gatherMs);
  const beat = Math.min(beatCount, Math.floor(rhythm / beatMs));
  const beatTime = rhythm % beatMs;
  const returning = elapsed >= returnAt;
  const dancing = elapsed >= gatherMs && beat < beatCount;
  const walking = dancing && beatTime < stepMs;
  const reaching = dancing && beatTime >= reachMs;
  const lap = (beat + (dancing ? ease(beatTime / stepMs) : 0)) / beatCount;
  const progress = returning ? ease((elapsed - returnAt) / returnMs) : 0;
  const growth =
    ((beat + (reaching ? ease((beatTime - reachMs) / 680) : 0)) / beatCount) *
    (1 - progress);
  const pose = walking ? 3 : reaching ? 2 : dancing ? 1 : 0;
  const reachTime = beatTime - reachMs;

  return {
    elapsed,
    growth,
    lap,
    returning,
    progress,
    walking,
    pose,
    // Use the same-costume crouch and extended-arm frames for the player.
    playerFrame:
      pose === 1
        ? 1
        : pose === 2
          ? reachTime < 110 || reachTime > 635
            ? 2
            : 3
          : null,
    bounce: reaching
      ? 0.14 * Math.sin(Math.PI * clamp((beatTime - reachMs) / 620))
      : 0,
  };
}

export function groveStart(position, direction, started) {
  return {
    origin: { ...position },
    direction,
    started,
    angle: Math.atan2(
      (position.z - groveTree.z) / radiusZ,
      (position.x - groveTree.x) / radiusX,
    ),
  };
}

function dancePosition(origin, startAngle, dance) {
  const angle = startAngle + dance.lap * Math.PI * 2;
  const ringX = groveTree.x + Math.cos(angle) * radiusX;
  const ringZ = groveTree.z + Math.sin(angle) * radiusZ;
  const approach = dance.returning
    ? 1 - dance.progress
    : ease(dance.elapsed / gatherMs);
  return {
    x: origin.x + (ringX - origin.x) * approach,
    z: origin.z + (ringZ - origin.z) * approach,
    angle,
    ringZ,
    approach,
  };
}

export function grovePlayer(session, dance) {
  const { x, z, angle, approach } = dancePosition(
    session.origin,
    session.angle,
    dance,
  );
  let dx = groveTree.x - x;
  let dz = groveTree.z - z;
  if (dance.walking) {
    dx = -Math.sin(angle) * radiusX;
    dz = Math.cos(angle) * radiusZ;
  } else if (approach < 1) {
    const sign = dance.returning ? -1 : 1;
    dx = (groveTree.x + Math.cos(angle) * radiusX - session.origin.x) * sign;
    dz = (groveTree.z + Math.sin(angle) * radiusZ - session.origin.z) * sign;
  }
  return {
    x,
    z,
    direction: dx || dz ? movementDirection(dx, dz) : session.direction,
  };
}

export function groveSpirits(dance) {
  return spirits.map((spirit, index) => {
    if (!dance) return { ...spirit, row: index * 2, pose: 0 };
    // The visitor fills one slot and the spirits take the other three.
    const startAngle = dance.playerAngle + ((index + 1) * Math.PI) / 2;
    const { x, z, angle, ringZ, approach } = dancePosition(
      spirit,
      startAngle,
      dance,
    );
    const stepping = dance.walking || (approach < 1 && approach > 0);
    const footfall = Math.sin(dance.elapsed / 95);
    // During a reach, turn toward the trunk. While circling, follow the tangent.
    const back = dance.walking ? Math.cos(angle) < 0 : ringZ > groveTree.z;
    return {
      x,
      z,
      h: spirit.h,
      row: index * 2 + Number(back && approach > 0.7),
      pose: stepping ? 3 : dance.pose,
      flip: stepping && footfall < 0,
      lift: stepping ? Math.abs(footfall) * 0.14 : dance.bounce,
    };
  });
}

// Draw each dancer through the same depth sort as the player and tree.
export function drawGroveSpirit(ctx, at, unit, image, spirit) {
  if (!image) return;
  const foot = at(spirit.x, spirit.z);
  const size = spirit.h * unit;
  const lift = (spirit.lift || 0) * unit;
  ctx.save();
  ctx.fillStyle = "#183d363c";
  ctx.beginPath();
  ctx.ellipse(foot.x, foot.y + 1, size * 0.28, size * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(foot.x, foot.y - lift);
  if (spirit.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    image,
    spirit.pose * cell,
    spirit.row * cell,
    cell,
    cell,
    -size / 2,
    -(132 / cell) * size,
    size,
    size,
  );
  ctx.restore();
}

export function drawGroveLights(ctx, at, unit, dance) {
  if (!dance || !dance.growth) return;
  const tree = at(groveTree.x, groveTree.z);
  ctx.save();
  ctx.fillStyle = "#f9e6a0";
  for (let i = 0; i < 16; i++) {
    const height =
      ((dance.elapsed / 840 + i * 0.39) % 1) * (3 + dance.growth * 3);
    const angle = i * 2.4 + dance.elapsed / 900;
    ctx.globalAlpha =
      dance.growth * (0.4 + 0.5 * Math.sin((height / 6) * Math.PI));
    ctx.beginPath();
    ctx.arc(
      tree.x + Math.cos(angle) * unit * (1.4 + height * 0.12),
      tree.y - height * unit,
      unit * 0.045,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}
