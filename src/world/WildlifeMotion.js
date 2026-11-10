// Contact points stay with the simulation. These secondary motions run between
// atlas poses and never move a catch target or a character's collision position.
const tau = 2 * Math.PI;
const bugStyles = {
  Spiders: "hop",
  Mantises: "sway",
  Butterflies: "flutter",
  Ladybugs: "scuttle",
  Dragonflies: "hover",
};

export const bugMotionStyle = (category) => bugStyles[category] || "hop";

function individualPhase(id = "") {
  let phase = 0;
  for (let i = 0; i < id.length; i++)
    phase = (phase * 31 + id.charCodeAt(i)) % 997;
  return phase / 997;
}

export function idleBodyMotion(id, time) {
  // A very small breath through the torso, pivoted at the planted feet.
  const breath = (1 - Math.cos(tau * (time / 2700 + individualPhase(id)))) / 2;
  return { scaleX: 1 + breath * 0.009, scaleY: 1 + breath * 0.017 };
}

export function wildlifePose(actor, time) {
  const offset = individualPhase(actor.id);
  const wave = (period) => Math.sin(tau * (time / period + offset));
  const phase = (period) => (time / period + offset) % 1;
  if (actor.kind === "duck" || actor.kind === "goose") {
    if (actor.inWater)
      return {
        lift: wave(1300) * 0.045,
        rotate: wave(1700) * 0.025,
        wake: actor.moving ? phase(1200) : null,
      };
    return actor.moving ? { lift: Math.abs(wave(410)) * 0.07 } : null;
  }
  if (actor.kind === "dog") {
    if (actor.sniffing) {
      const dip = (1 - Math.cos(tau * phase(690))) / 2;
      const side = Math.sign(Math.sin((actor.direction * Math.PI) / 4));
      return { rotate: dip * side * 0.14, scaleY: 1 - dip * 0.05 };
    }
    if (actor.moving) {
      const footfall = Math.sin(((actor.time ?? time) * tau) / 350);
      return { lift: Math.abs(footfall) * 0.09, scaleY: 1 + footfall * 0.023 };
    }
    return idleBodyMotion(actor.id, time);
  }
  if (actor.kind === "pond")
    return {
      lift: wave(1500) * 0.09,
      rotate: wave(980) * 0.055,
      scaleX: 1 + wave(410) * 0.02,
    };
  if (actor.kind !== "land") return null;
  if (actor.lift > 0) return { rotate: wave(410) * 0.11, shadow: actor.lift };
  switch (bugMotionStyle(actor.category)) {
    case "flutter":
      return {
        lift: 0.34 + wave(880) * 0.15,
        rotate: wave(760) * 0.13,
        scaleX: 1 + wave(155) * 0.07,
        shadow: 0.34,
      };
    case "hover":
      return {
        lift: 0.27 + wave(1000) * 0.075,
        rotate: wave(540) * 0.08,
        scaleX: 1 + wave(100) * 0.035,
        shadow: 0.27,
      };
    case "sway":
      return { rotate: wave(1600) * 0.09, scaleY: 1 + wave(970) * 0.025 };
    case "scuttle":
      return { lift: Math.abs(wave(250)) * 0.045, rotate: wave(250) * 0.06 };
    default: {
      const hop = Math.max(0, Math.sin((Math.PI * phase(2450)) / 0.26));
      const lift = phase(2450) < 0.26 ? hop * 0.25 : 0;
      return { lift, scaleY: 1 + lift * 0.12, shadow: lift };
    }
  }
}

// Trails are drawn underneath a swimmer and fade before they reach another
// bird. The opening V follows the actual heading rather than the painted row.
export function drawWildlifeContact(ctx, p, unit, actor, motion) {
  if (motion.wake != null) {
    const angle = (actor.direction * Math.PI) / 4;
    ctx.save();
    ctx.translate(p.x, p.y - unit * 0.1);
    ctx.rotate(-angle);
    ctx.strokeStyle = "#e1fbf2";
    ctx.lineWidth = Math.max(1, unit * 0.027);
    ctx.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      const t = (motion.wake + i / 2) % 1;
      const spread = unit * (0.16 + 0.24 * t);
      const rear = -unit * (0.23 + 0.59 * t);
      ctx.globalAlpha = 0.65 * Math.sin(Math.PI * t);
      ctx.beginPath();
      ctx.moveTo(-spread, rear - unit * 0.18);
      ctx.quadraticCurveTo(0, rear + unit * 0.08, spread, rear - unit * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  } else if (motion.shadow > 0) {
    ctx.fillStyle = "#21363255";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, unit * 0.15, unit * 0.055, 0, 0, tau);
    ctx.fill();
  }
}
