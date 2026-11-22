import { windfallTree } from "./TownLayout";
export const noFaceInteraction = {
  id: "no-face",
  type: "no-face",
  label: "Visit No-Face",
  x: 26.1,
  z: 11.8,
};
const home = { x: windfallTree.x + 1.05, z: windfallTree.z + 0.14 };
// Step east of the neighboring palm's canopy before offering the coins. At
// the interaction point itself its foreground leaves would hide the whole gift.
const offeringSpot = { x: 27.3, z: 11.2 };
const ease = (t) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
export function readGold() {
  try {
    return Math.max(
      0,
      Math.min(
        999999,
        Number(localStorage.getItem("island-no-face-gold")) || 0,
      ),
    );
  } catch {
    return 0;
  }
}
export function createNoFace() {
  let session = null;
  return {
    active: () => !!session,
    start(origin, time) {
      if (session) return false;
      session = { origin: { ...origin }, started: time, awarded: false };
      return true;
    },
    stop() {
      const origin = session?.origin;
      session = null;
      return origin;
    },
    snapshot(time) {
      if (!session) return null;
      const age = time - session.started,
        out = ease(age / 900),
        back = ease((age - 4100) / 1200),
        progress = age < 4100 ? out : 1 - back;
      return {
        x: home.x + (offeringSpot.x - home.x) * progress,
        z: home.z + (offeringSpot.z - home.z) * progress,
        age,
        offering: ease((age - 900) / 700) * (1 - back),
        receiving: ease((age - 2300) / 900),
        bow: Math.sin(Math.PI * ease((age - 3450) / 600)) * 0.12,
        origin: session.origin,
        returning: age >= 4100,
        done: age >= 5300,
      };
    },
    update(time) {
      const pose = this.snapshot(time);
      if (!pose) return null;
      let reward = 0;
      if (pose.age >= 3200 && !session.awarded) {
        session.awarded = true;
        reward = 5;
        try {
          localStorage.setItem(
            "island-no-face-gold",
            String(readGold() + reward),
          );
        } catch {
          /* The visit still has its visual gift when storage is unavailable. */
        }
      }
      return { ...pose, reward };
    },
  };
}
// The robe's reaching arm and coin arc share No-Face's current projected body.
// They are drawn on his depth-sorted sprite, so he emerges from behind the tree.
export function drawNoFace(ctx, at, unit, pose, state, drawBody, height) {
  ctx.save();
  const p = at(pose.x, pose.z);
  ctx.translate(p.x, p.y);
  ctx.scale(1, 1 - (pose.bow || 0));
  ctx.translate(-p.x, -p.y);
  drawBody();
  ctx.restore();
  if (!pose.offering) return;
  const player = at(pose.origin.x, pose.origin.z),
    hand = { x: p.x - unit * 0.46 * pose.offering, y: p.y - unit * 0.75 };
  ctx.save();
  ctx.strokeStyle = "#14161c";
  ctx.lineWidth = unit * 0.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p.x - unit * 0.15, p.y - unit * 0.9);
  ctx.quadraticCurveTo(p.x - unit * 0.55, p.y - unit * 0.55, hand.x, hand.y);
  ctx.stroke();
  ctx.fillStyle = "#292832";
  ctx.beginPath();
  ctx.ellipse(hand.x, hand.y, unit * 0.2, unit * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const t = Math.max(0, Math.min(1, (pose.age - 2300 - i * 100) / 650)),
      x = hand.x + (player.x - hand.x) * t + (i - 2) * unit * 0.05 * (1 - t),
      y =
        hand.y +
        (player.y - height * 0.42 * unit - hand.y) * t -
        Math.sin(Math.PI * t) * unit * 0.65 -
        (i % 2) * unit * 0.06;
    if (pose.age > 3200 + i * 100) continue;
    ctx.fillStyle = "#e8bd56";
    ctx.strokeStyle = "#8d642d";
    ctx.lineWidth = Math.max(1, unit * 0.018);
    ctx.beginPath();
    ctx.ellipse(x, y, unit * 0.075, unit * 0.053, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff2b8";
    ctx.fillRect(x - unit * 0.03, y - unit * 0.03, unit * 0.04, unit * 0.016);
  }
  if (pose.age > 3150 && pose.age < 4100) {
    ctx.globalAlpha = 1 - ease((pose.age - 3150) / 950);
    ctx.fillStyle = "#fff0a4";
    ctx.font = `600 ${Math.round(unit * 0.42)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("+5 ✦", player.x, player.y - height * unit - unit * 0.25);
  }
  ctx.restore();
}
