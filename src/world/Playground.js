import { movementDirection } from "./animation";

export const playgroundActivities = {
  playhouse: "Go Down the Slide",
  swings: "Ride the Swings",
  seesaw: "Ride the Seesaw Together",
  "picnic-table": "Sit at the Playground Table",
  tunnel: "Crawl Through the Tunnel",
  "climbing-dome": "Climb the Dome",
  "spring-rider": "Ride the Spring Rider",
  roundabout: "Ride the Merry-Go-Round",
};
const ratios = {
  playhouse: 298 / 272,
  swings: 294 / 258,
  seesaw: 303 / 166,
  "picnic-table": 256 / 237,
  tunnel: 256 / 165,
  "climbing-dome": 256 / 200,
};
const clamp = (t) => Math.max(0, Math.min(1, t));
const ease = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  z: a.z + (b.z - a.z) * t,
});
// Coordinates are attachment points in the actual equipment illustration.
// A seated pose puts its hips here; a walking pose puts its feet here. There
// is no second, guessed elevation to accidentally lift a climber onto a roof.
export function equipmentPoint(prop, u, v) {
  return {
    x: prop.x + (u - 0.5) * prop.h * (ratios[prop.id] || 1),
    z: prop.z + (v - 1) * prop.h,
  };
}
export function seesawSeat(prop, side, tilt) {
  const base = equipmentPoint(
    prop,
    side < 0 ? 0.13 : 0.9,
    side < 0 ? 0.75 : 0.22,
  );
  const pivot = equipmentPoint(prop, 0.55, 0.62),
    dx = base.x - pivot.x,
    dz = base.z - pivot.z;
  return {
    x: pivot.x + dx * Math.cos(tilt) + dz * Math.sin(tilt),
    z: pivot.z - dx * Math.sin(tilt) + dz * Math.cos(tilt),
  };
}
export function swingSeat(prop, tilt) {
  const seat = equipmentPoint(prop, 0.365, 0.775);
  return {
    x: seat.x + Math.sin(tilt) * 0.08,
    z: seat.z + Math.sin(tilt) * 0.6 - (1 - Math.cos(tilt)) * prop.h * 0.62,
  };
}
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
      const { prop, origin, partner, started } = current,
        age = Math.max(0, time - started),
        phase = age / 1000;
      let point = { x: prop.x, z: prop.z - 0.2 },
        direction = 0,
        seated = false,
        crouch = false,
        rotation = 0,
        tilt = 0,
        guest = null,
        exitAt = 8800,
        stage = "playing",
        climbing = false,
        celebrating = false;
      if (prop.id === "swings") {
        tilt =
          Math.sin(phase * 2.1) *
          0.42 *
          ease(age / 1100) *
          ease((8800 - age) / 1000);
        point = swingSeat(prop, tilt);
        seated = true;
        direction = 0;
        rotation = -Math.sin(tilt) * 0.1;
      } else if (prop.id === "seesaw") {
        tilt =
          Math.sin(phase * 1.8) *
          0.16 *
          ease(age / 900) *
          ease((8800 - age) / 900);
        point = seesawSeat(prop, -1, tilt);
        seated = true;
        direction = 2;
        if (partner)
          guest = {
            ...seesawSeat(prop, 1, tilt),
            direction: 6,
            seated: true,
            lift: 0,
            anchor: "hips",
          };
      } else if (prop.id === "playhouse") {
        const bottom = equipmentPoint(prop, 0.11, 0.94),
          top = equipmentPoint(prop, 0.34, 0.55),
          mouth = equipmentPoint(prop, 0.55, 0.53);
        exitAt = 5900;
        if (age < 800) {
          point = mix(origin, bottom, ease(age / 800));
          direction = movementDirection(
            bottom.x - origin.x,
            bottom.z - origin.z,
          );
          stage = "approaching";
        } else if (age < 3100) {
          point = mix(bottom, top, (age - 800) / 2300);
          direction = 4;
          stage = "climbing";
        } else if (age < 3650) {
          point = mix(top, mouth, ease((age - 3100) / 550));
          direction = 2;
          stage = "platform";
        } else if (age < 4900) {
          const t = ease((age - 3650) / 1250),
            a = equipmentPoint(prop, 0.55, 0.53),
            b = equipmentPoint(prop, 0.64, 0.8),
            c = equipmentPoint(prop, 0.88, 0.94);
          point = {
            x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x,
            z: (1 - t) ** 2 * a.z + 2 * (1 - t) * t * b.z + t * t * c.z,
          };
          seated = true;
          direction = 1;
          stage = "sliding";
        } else {
          point = equipmentPoint(prop, 0.92, 1.03);
          direction = 1;
          stage = "landing";
        }
      } else if (prop.id === "picnic-table") {
        point = equipmentPoint(prop, 0.26, 0.82);
        seated = true;
        direction = 2;
      } else if (prop.id === "spring-rider") {
        point = { x: prop.x, z: prop.z - 0.72 };
        seated = true;
        rotation = Math.sin(phase * 2.7) * 0.08;
        tilt = rotation;
        direction = 2;
      } else if (prop.id === "tunnel") {
        const outside = equipmentPoint(prop, -0.12, 0.88),
          entry = equipmentPoint(prop, 0.22, 0.8),
          exit = equipmentPoint(prop, 0.84, 0.83),
          beyond = equipmentPoint(prop, 1.14, 0.94);
        direction = 2;
        exitAt = 5600;
        if (age < 900) {
          point = mix(origin, outside, ease(age / 900));
          stage = "approaching";
        } else if (age < 2100) {
          point = mix(outside, entry, ease((age - 900) / 1200));
          crouch = true;
          stage = "entering-tunnel";
        } else if (age < 3900) {
          point = mix(entry, exit, (age - 2100) / 1800);
          crouch = true;
          stage = "inside-tunnel";
        } else if (age < 5100) {
          point = mix(exit, beyond, ease((age - 3900) / 1200));
          crouch = true;
          stage = "exiting-tunnel";
        } else {
          point = beyond;
          stage = "landing";
        }
      } else if (prop.id === "climbing-dome") {
        const foot = equipmentPoint(prop, 0.5, 0.97),
          summit = equipmentPoint(prop, 0.5, 0.12);
        exitAt = 10000;
        if (age < 850) {
          point = mix(origin, foot, ease(age / 850));
          direction = movementDirection(foot.x - origin.x, foot.z - origin.z);
          stage = "approaching";
        } else if (age < 5050) {
          // Reach, grip, then pull up one rung; never a walking cycle on ropes.
          const step = Math.min(5.999, (age - 850) / 700),
            progress =
              (Math.floor(step) +
                ease(Math.max(0, ((step % 1) - 0.28) / 0.72))) /
              6;
          point = mix(foot, summit, progress);
          direction = 4;
          climbing = true;
          stage = "climbing-net";
        } else if (age < 7550) {
          point = summit;
          direction = 0;
          celebrating = true;
          stage = "summit";
        } else {
          point = mix(summit, foot, ease((age - 7550) / 2450));
          direction = 4;
          climbing = true;
          stage = "descending-net";
        }
      } else if (prop.id === "roundabout") {
        const angle = -Math.PI / 2 + phase * 1.25 * ease(age / 1600);
        point = {
          x: prop.x + Math.cos(angle) * 1.05,
          z: prop.z - 0.2 + Math.sin(angle) * 0.42,
        };
        direction = movementDirection(prop.x - point.x, prop.z - 0.2 - point.z);
        seated = true;
        tilt = angle;
      }
      const returning = age > exitAt,
        q = ease((age - exitAt) / 1000);
      if (returning) {
        direction = movementDirection(origin.x - point.x, origin.z - point.z);
        point = mix(point, origin, q);
        stage = "returning";
      }
      // Boarding eases onto a seat; the slide already has its own approach path.
      if (seated && age < 650) point = mix(origin, point, ease(age / 650));
      const player = {
        ...point,
        lift: 0,
        direction,
        seated: seated && !returning,
        crouch: crouch && !returning,
        rotation,
        anchor: seated && !returning ? "hips" : "feet",
        moving: (!seated && !climbing && !celebrating) || returning,
        climbing: climbing && !returning,
        celebrating: celebrating && !returning,
        poseTime: age,
        stage,
      };
      return {
        id: prop.id,
        prop,
        origin,
        elapsed: age,
        tilt,
        player,
        partner,
        guest,
        done: age >= exitAt + 1000,
      };
    },
  };
}

// Draw only the original left swing's seat/ropes dynamically. The right swing,
// A-frame, feet and crossbar remain intact. The moving seat retains its drawn
// wood grain rather than being replaced with a rectangular placeholder.
export function drawPlayground(
  ctx,
  at,
  unit,
  activity,
  drawProp,
  drawPerson,
  image,
) {
  const p = activity.prop,
    foot = at(p.x, p.z);
  if (p.id === "swings") {
    const h = p.h * unit,
      w = (h * 294) / 258,
      left = foot.x - w / 2,
      top = foot.y - h;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, w, h);
    ctx.rect(left + w * 0.235, top + h * 0.17, w * 0.29, h * 0.675);
    ctx.clip("evenodd");
    drawProp();
    ctx.restore();
    const seat = at(...[activity.player.x, activity.player.z]);
    const a = equipmentPoint(p, 0.29, 0.145),
      b = equipmentPoint(p, 0.475, 0.145);
    const half = w * 0.105;
    ctx.save();
    for (const [anchor, side] of [
      [a, -1],
      [b, 1],
    ]) {
      const start = at(anchor.x, anchor.z),
        end = { x: seat.x + side * half, y: seat.y };
      ctx.strokeStyle = "#5a3f2b";
      ctx.lineWidth = Math.max(2, unit * 0.058);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.strokeStyle = "#d9b97c";
      ctx.lineWidth = Math.max(1, unit * 0.031);
      ctx.stroke();
      for (let t = 0.1; t < 1; t += 0.13) {
        const x = start.x + (end.x - start.x) * t,
          y = start.y + (end.y - start.y) * t;
        ctx.fillStyle = "#f1cf89";
        ctx.fillRect(
          x - unit * 0.028,
          y - unit * 0.018,
          unit * 0.055,
          unit * 0.035,
        );
      }
    }
    const img = image?.("town-swings");
    if (img)
      ctx.drawImage(
        img,
        img.width * 0.235,
        img.height * 0.72,
        img.width * 0.29,
        img.height * 0.125,
        seat.x - w * 0.145,
        seat.y - h * 0.03,
        w * 0.29,
        h * 0.125,
      );
    drawPerson(activity.player, true);
    ctx.restore();
    return;
  }
  if (p.id === "seesaw") {
    const h = p.h * unit,
      w = (h * 303) / 166,
      left = foot.x - w / 2,
      top = foot.y - h;
    const support = [
      [104, 146],
      [145, 76],
      [190, 62],
      [233, 147],
      [194, 166],
      [135, 158],
    ];
    const shape = () => {
      support.forEach(([x, y], i) =>
        i
          ? ctx.lineTo(left + (x / 303) * w, top + (y / 166) * h)
          : ctx.moveTo(left + (x / 303) * w, top + (y / 166) * h),
      );
      ctx.closePath();
    };
    ctx.save();
    ctx.beginPath();
    shape();
    ctx.clip();
    drawProp();
    ctx.restore();
    const pivot = equipmentPoint(p, 0.55, 0.62),
      atPivot = at(pivot.x, pivot.z);
    ctx.save();
    ctx.translate(atPivot.x, atPivot.y);
    ctx.rotate(-activity.tilt);
    ctx.translate(-atPivot.x, -atPivot.y);
    ctx.beginPath();
    ctx.rect(left - 2, top - 2, w + 4, h + 4);
    shape();
    ctx.clip("evenodd");
    drawProp();
    ctx.restore();
    drawPerson(activity.player, true);
    if (activity.guest) drawPerson(activity.guest, false);
    return;
  }
  if (p.id === "tunnel") {
    const h = p.h * unit,
      w = h * ratios.tunnel,
      left = foot.x - w / 2,
      top = foot.y - h;
    // The wooden tube occludes the crawler. Only its two actual openings
    // reveal the person; they do not crawl along the painted outside wall.
    const portalX = (at(activity.player.x, activity.player.z).x - left) / w;
    if (!activity.player.crouch || portalX < 0.08 || portalX > 1.03)
      drawPerson(activity.player, true);
    drawProp();
    if (activity.player.crouch) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        left + w * 0.22,
        top + h * 0.55,
        w * 0.072,
        h * 0.245,
        0,
        0,
        Math.PI * 2,
      );
      ctx.ellipse(
        left + w * 0.835,
        top + h * 0.585,
        w * 0.073,
        h * 0.255,
        0,
        0,
        Math.PI * 2,
      );
      ctx.clip();
      drawPerson(activity.player, true);
      ctx.restore();
    }
    return;
  }
  if (p.id === "roundabout") {
    drawRoundabout(
      ctx,
      at,
      unit,
      p,
      activity.tilt,
      () => drawPerson(activity.player, true),
      activity.player,
    );
    return;
  }
  ctx.save();
  if (p.id === "spring-rider") {
    ctx.translate(foot.x, foot.y);
    ctx.rotate(activity.tilt);
    ctx.translate(-foot.x, -foot.y);
  }
  drawProp();
  ctx.restore();
  drawPerson(activity.player, true);
  if (
    p.id === "playhouse" &&
    activity.elapsed > 2100 &&
    activity.elapsed < 4100
  ) {
    const img = image?.("town-playhouse");
    if (img) {
      const h = p.h * unit,
        w = (h * 298) / 272;
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height * 0.36,
        foot.x - w / 2,
        foot.y - h,
        w,
        h * 0.36,
      );
    }
  }
}

// The carousel is built in the same wood, brass and teal palette. Projected
// seat sockets and rail depth share one angle, keeping the rider on the deck.
export function drawRoundabout(
  ctx,
  at,
  unit,
  prop,
  angle,
  drawRider = () => {},
  rider = null,
) {
  const p = at(prop.x, prop.z - 0.2),
    rx = unit * 1.45,
    ry = unit * 0.55;
  ctx.save();
  ctx.fillStyle = "#153c373f";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + unit * 0.18, rx * 1.05, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  const wood = ctx.createLinearGradient(p.x, p.y - ry, p.x, p.y + ry);
  wood.addColorStop(0, "#e3b26a");
  wood.addColorStop(1, "#85512e");
  ctx.fillStyle = wood;
  ctx.strokeStyle = "#66462e";
  ctx.lineWidth = unit * 0.06;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = angle + (i * Math.PI) / 6;
    ctx.strokeStyle = i % 2 ? "#956536" : "#f1cc88";
    ctx.lineWidth = unit * 0.022;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(a) * rx, p.y + Math.sin(a) * ry);
    ctx.stroke();
  }
  const seats = Array.from({ length: 4 }, (_, i) => {
    const a = angle + (i * Math.PI) / 2;
    return {
      x: p.x + Math.cos(a) * unit * 1.05,
      y: p.y + Math.sin(a) * unit * 0.42,
    };
  }).sort((a, b) => a.y - b.y);
  const rail = (s) => {
    ctx.strokeStyle = "#785730";
    ctx.lineWidth = unit * 0.095;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x, s.y - unit * 0.68);
    ctx.lineTo(p.x, p.y - unit * 0.88);
    ctx.stroke();
    ctx.strokeStyle = "#e8bc63";
    ctx.lineWidth = unit * 0.045;
    ctx.stroke();
    ctx.fillStyle = "#279589";
    ctx.beginPath();
    ctx.ellipse(
      s.x,
      s.y - unit * 0.1,
      unit * 0.26,
      unit * 0.1,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = "#175b59";
    ctx.lineWidth = unit * 0.03;
    ctx.stroke();
  };
  const hub = () => {
    ctx.fillStyle = "#d2a45b";
    ctx.fillRect(p.x - unit * 0.07, p.y - unit * 0.95, unit * 0.14, unit * 0.9);
    ctx.fillStyle = "#3caaa1";
    ctx.beginPath();
    ctx.arc(p.x, p.y - unit * 0.96, unit * 0.13, 0, Math.PI * 2);
    ctx.fill();
  };
  // Sort each support and the center post by the rider's actual seat depth.
  // The center post used to be painted last, straight across a front rider.
  const riderY = rider ? at(rider.x, rider.z).y : Infinity;
  const parts = seats.map((seat) => ({
    depth: seat.y,
    draw: () => rail(seat),
  }));
  parts.push({ depth: p.y, draw: hub });
  parts
    .filter((part) => part.depth < riderY)
    .sort((a, b) => a.depth - b.depth)
    .forEach((part) => part.draw());
  drawRider();
  parts
    .filter((part) => part.depth >= riderY)
    .sort((a, b) => a.depth - b.depth)
    .forEach((part) => part.draw());
  ctx.restore();
}
