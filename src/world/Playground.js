import { movementDirection } from "./animation";

export const playgroundActivities = {
  playhouse: "Go Down the Slide",
  swings: "Ride the Swings",
  seesaw: "Ride the Seesaw Together",
  "picnic-table": "Sit at the Playground Table",
  tunnel: "Crawl Through the Tunnel",
  "climbing-dome": "Climb the Dome",
  "spring-rider": "Ride the Spring Rider",
  "balance-trail": "Walk the Balance Trail",
};
const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};

// One cancellable scene-clock activity owns both riders. Every pose is relative
// to the placed equipment, so moving a prop also moves its ride and hit target.
export function createPlayground() {
  let current = null;
  return {
    active: () => !!current,
    start(prop, player, partner, time) {
      if (current || !playgroundActivities[prop.id]) return false;
      current = { prop, origin: { ...player }, partner, started: time };
      return true;
    },
    stop() {
      const origin = current?.origin;
      current = null;
      return origin;
    },
    snapshot(time) {
      if (!current) return null;
      const { prop, origin, partner, started } = current;
      const age = time - started;
      const phase = age / 1000;
      let x = prop.x,
        z = prop.z - 0.25,
        lift = 0.4,
        direction = 0,
        tilt = 0;
      const seated = [
        "swings",
        "seesaw",
        "picnic-table",
        "spring-rider",
      ].includes(prop.id);
      if (prop.id === "swings") {
        tilt = Math.sin(phase * 2.25) * 0.55 * ease(age / 900);
        x -= 0.45;
        z += Math.sin(tilt) * 0.85;
        lift = 0.55 + (1 - Math.cos(tilt)) * 1.5;
      } else if (prop.id === "seesaw") {
        tilt = Math.sin(phase * 2) * 0.2 * ease(age / 700);
        x -= 1.05;
        lift = 0.65 - Math.sin(tilt) * 1.05;
      } else if (prop.id === "playhouse") {
        // Walk up the actual left ladder, cross the platform, then slide down
        // the right-hand chute. Return on foot, never teleport between stages.
        const t = Math.max(0, age - 300);
        if (t < 2500) {
          const q = ease(t / 2500);
          x -= 1.55 - q * 0.45;
          z -= q * 0.9;
          lift = q * 2.4;
          direction = 4;
        } else if (t < 3300) {
          const q = ease((t - 2500) / 800);
          x += -0.1 + q * 0.55;
          z -= 0.9;
          lift = 2.4;
          direction = 2;
        } else {
          const q = ease((t - 3300) / 1700);
          x += 0.45 + q * 1.6;
          z += -0.9 + q * 1.4;
          lift = 2.4 * (1 - q);
          direction = 1;
        }
      } else if (prop.id === "picnic-table") {
        x -= 0.5;
        z += 0.1;
        lift = 0.6;
        direction = 2;
      } else if (prop.id === "spring-rider") {
        tilt = Math.sin(phase * 3.1) * 0.12;
        lift = 0.55;
      } else if (prop.id === "tunnel") {
        x += -1 + ease(age / 3500) * 2;
        direction = 2;
        lift = -0.1;
      } else if (prop.id === "climbing-dome") {
        lift = Math.sin(Math.PI * clamp(age / 5000)) * 1.6;
        direction = age < 2500 ? 4 : 0;
      } else {
        x += -1.4 + ease(age / 5000) * 2.8;
        direction = 2;
        lift = 0.2;
      }
      const exitAt = prop.id === "playhouse" ? 5600 : seated ? 9000 : 5600;
      const returning = age > exitAt;
      const q = ease((age - exitAt) / 1100);
      const player = {
        x: x + (origin.x - x) * q,
        z: z + (origin.z - z) * q,
        lift: lift * (1 - q),
        direction: returning
          ? movementDirection(origin.x - x, origin.z - z)
          : direction,
        seated:
          (seated || (prop.id === "playhouse" && age >= 3600)) && !returning,
        moving: returning || !seated,
        crouch: prop.id === "tunnel" && !returning,
        rotation: prop.id === "spring-rider" ? tilt : 0,
      };
      return {
        id: prop.id,
        prop,
        origin,
        elapsed: age,
        tilt,
        player,
        partner,
        guest:
          partner && prop.id === "seesaw"
            ? {
                x: prop.x + 1.05,
                z: prop.z - 0.25,
                lift: 0.65 + Math.sin(tilt) * 1.05,
                direction: 6,
              }
            : null,
        done: age >= exitAt + 1100,
      };
    },
  };
}

// Animated equipment uses the existing wood/teal illustration palette. The
// static ropes/seat are clipped out while swinging, then replaced at their real
// moving positions. Rider feet and seat share the same transform.
export function drawPlayground(ctx, at, unit, activity, drawProp, drawPerson) {
  const p = activity.prop,
    foot = at(p.x, p.z);
  ctx.save();
  if (p.id === "swings") {
    const h = p.h * unit,
      w = (h * 294) / 258;
    ctx.beginPath();
    ctx.rect(foot.x - w / 2, foot.y - h, w, h);
    ctx.rect(foot.x - w * 0.29, foot.y - h * 0.79, w * 0.58, h * 0.66);
    ctx.clip("evenodd");
    drawProp();
    ctx.restore();
    ctx.save();
    const pivot = at(p.x - 0.45, p.z - 2.55),
      seat = at(activity.player.x, activity.player.z - activity.player.lift);
    ctx.strokeStyle = "#cba46b";
    ctx.lineWidth = unit * 0.055;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(pivot.x + side * unit * 0.27, pivot.y);
      ctx.lineTo(seat.x + side * unit * 0.27, seat.y);
      ctx.stroke();
    }
    ctx.fillStyle = "#b87937";
    ctx.fillRect(
      seat.x - unit * 0.39,
      seat.y - unit * 0.04,
      unit * 0.78,
      unit * 0.12,
    );
  } else if (p.id === "seesaw") {
    const pivot = at(p.x, p.z - 0.65);
    ctx.fillStyle = "#97632f";
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y - unit * 0.15);
    ctx.lineTo(pivot.x - unit * 0.35, foot.y);
    ctx.lineTo(pivot.x + unit * 0.35, foot.y);
    ctx.closePath();
    ctx.fill();
    ctx.translate(pivot.x, pivot.y);
    ctx.rotate(-activity.tilt);
    const wood = ctx.createLinearGradient(0, -unit * 0.13, 0, unit * 0.1);
    wood.addColorStop(0, "#e5ac58");
    wood.addColorStop(1, "#8a5027");
    ctx.fillStyle = wood;
    ctx.fillRect(-unit * 1.5, -unit * 0.08, unit * 3, unit * 0.16);
    ctx.fillStyle = "#309b94";
    for (const side of [-1, 1]) {
      ctx.fillRect(
        side * unit * 1.1 - unit * 0.22,
        -unit * 0.16,
        unit * 0.44,
        unit * 0.13,
      );
      ctx.fillRect(side * unit * 0.8, -unit * 0.5, unit * 0.07, unit * 0.4);
    }
  } else if (p.id === "spring-rider") {
    ctx.translate(foot.x, foot.y);
    ctx.rotate(activity.tilt);
    ctx.translate(-foot.x, -foot.y);
    drawProp();
  } else drawProp();
  ctx.restore();
  drawPerson(activity.player, true);
  if (activity.guest) drawPerson({ ...activity.guest, seated: true }, false);
}
