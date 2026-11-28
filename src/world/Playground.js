import { movementDirection } from "./animation";

export const playgroundActivities = {
  playhouse: "Go Down the Slide",
  swings: "Ride the Swings",
  seesaw: "Ride the Seesaw Together",
  "picnic-table": "Sit at the Playground Table",
  trampoline: "Bounce on the Trampoline",
  "climbing-dome": "Climb the Dome",
  basketball: "Shoot Hoops",
  roundabout: "Ride the Merry-Go-Round",
};
const ratios = {
  playhouse: 298 / 272,
  swings: 294 / 258,
  seesaw: 303 / 166,
  "picnic-table": 256 / 237,
  trampoline: 256 / 144,
  basketball: 208 / 160,
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
export function swingSeat(prop, tilt, slot = 0) {
  const seat = equipmentPoint(prop, 0.365 + slot * 0.335, 0.775);
  return {
    x: seat.x + Math.sin(tilt) * 0.08,
    z: seat.z + Math.sin(tilt) * 0.6 - (1 - Math.cos(tilt)) * prop.h * 0.62,
  };
}
// Approach the slide along its outside edge and front apron. The ladder is the
// only elevated route; the roof and chute are never part of a walking path.
export function slideApproach(prop, origin) {
  const apron = equipmentPoint(prop, -0.13, 1.12);
  const side = equipmentPoint(prop, -0.13, -0.08);
  const right = equipmentPoint(prop, 1.13, 1.12);
  const back = equipmentPoint(prop, 1.13, -0.08);
  const bottom = equipmentPoint(prop, 0.11, 0.96);
  if (origin.z < apron.z - prop.h * 0.2) {
    if (origin.x < prop.x) {
      return origin.z < side.z
        ? [origin, { x: side.x, z: origin.z }, side, apron, bottom]
        : [origin, { x: side.x, z: origin.z }, apron, bottom];
    }
    return origin.z < back.z
      ? [origin, { x: back.x, z: origin.z }, back, right, apron, bottom]
      : [origin, { x: right.x, z: origin.z }, right, apron, bottom];
  }
  return [origin, { x: origin.x, z: apron.z }, apron, bottom];
}
function followPath(points, t) {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.z - points[i].z));
  let distance = clamp(t) * lengths.reduce((sum, n) => sum + n, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const a = points[i],
        b = points[i + 1];
      return {
        ...mix(a, b, lengths[i] ? clamp(distance / lengths[i]) : 1),
        direction: movementDirection(b.x - a.x, b.z - a.z),
      };
    }
    distance -= lengths[i];
  }
  return points[0];
}
const pathLength = (points) =>
  points
    .slice(1)
    .reduce(
      (sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.z - points[i].z),
      0,
    );
// Rungs have physical contact points rather than equal distance along an
// imaginary line. Each alternating reach pauses on a rung, then pulls up.
export function climbRungs(points, progress, descending = false) {
  const last = points.length - 1;
  const step = clamp(progress) * last;
  const index = Math.min(last - 1, Math.floor(step));
  const fraction = step - index;
  const position = mix(
    points[index],
    points[index + 1],
    ease((fraction - 0.22) / 0.78),
  );
  const cycle = (((step / 2) % 1) + 1) % 1;
  return { position, cycle: descending ? (1 - cycle) % 1 : cycle };
}
export function createPlayground() {
  let current = null;
  return {
    active: () => !!current,
    start(prop, player, partner, time, { npc = false, slot = 0 } = {}) {
      if (current || !playgroundActivities[prop.id]) return false;
      current = {
        prop,
        origin: { ...player },
        partner,
        started: time,
        npc,
        slot,
        approach: prop.id === "playhouse" ? slideApproach(prop, player) : null,
      };
      return true;
    },
    trick(time, random = Math.random) {
      if (
        current?.prop.id !== "trampoline" ||
        time - current.started < 1400 ||
        (current.trick && time - current.trick.started < 950)
      )
        return false;
      current.trick = {
        started: time,
        kind: ["backflip", "frontflip", "full"][
          Math.min(2, Math.floor(random() * 3))
        ],
      };
      return true;
    },
    stop() {
      const origin = current?.origin;
      current = null;
      return origin;
    },
    snapshot(time, sharedTime = time) {
      if (!current) return null;
      const { prop, origin, partner, started, approach } = current,
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
        celebrating = false,
        climbCycle = 0,
        celebrateTime = 0,
        lift = 0,
        spinScale = 1,
        seatWeight = null,
        returnPath = null,
        returnDuration = 1000;
      if (prop.id === "swings") {
        tilt =
          Math.sin(phase * 2.1) *
          0.42 *
          ease((age - 650) / 1100) *
          ease((8800 - age) / 1000);
        point = swingSeat(prop, tilt, current.slot);
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
        if (partner) {
          guest = {
            ...seesawSeat(prop, 1, tilt),
            direction: 6,
            seated: true,
            lift: 0,
            anchor: "hips",
          };
          if (Number.isFinite(partner.x) && Number.isFinite(partner.z)) {
            const boarding = age < 650,
              leaving = age > exitAt;
            if (boarding || leaving) {
              const t = boarding
                ? ease(age / 650)
                : 1 - ease((age - exitAt) / returnDuration);
              guest = {
                ...mix(partner, guest, t),
                direction: movementDirection(
                  guest.x - partner.x,
                  guest.z - partner.z,
                ),
                seated: false,
                moving: true,
                anchor: "feet",
                lift: 0,
                stage: boarding ? "approaching" : "returning",
              };
            }
          }
        }
      } else if (prop.id === "playhouse") {
        const bottom = approach.at(-1),
          top = equipmentPoint(prop, 0.32, 0.51),
          mouth = equipmentPoint(prop, 0.55, 0.53);
        const approachTime = Math.min(
          4300,
          Math.max(900, pathLength(approach) * 240),
        );
        const climbEnd = approachTime + 2300,
          platformEnd = climbEnd + 550;
        const slideEnd = platformEnd + 1250;
        exitAt = slideEnd + 600;
        const landing = equipmentPoint(prop, 0.92, 1.03);
        const front = equipmentPoint(prop, 1.13, 1.12);
        returnPath = [landing, front, ...[...approach].reverse().slice(1)];
        returnDuration = Math.min(
          3200,
          Math.max(1000, pathLength(returnPath) * 210),
        );
        if (age < approachTime) {
          point = followPath(approach, age / approachTime);
          direction = point.direction;
          stage = "approaching";
        } else if (age < climbEnd) {
          const ladder = Array.from({ length: 5 }, (_, i) =>
            mix(bottom, top, i / 4),
          );
          const climb = climbRungs(ladder, (age - approachTime) / 2300);
          point = climb.position;
          climbCycle = climb.cycle;
          direction = 4;
          climbing = true;
          stage = "climbing";
        } else if (age < platformEnd) {
          point = mix(top, mouth, ease((age - climbEnd) / 550));
          direction = 2;
          stage = "platform";
        } else if (age < slideEnd) {
          const t = ease((age - platformEnd) / 1250),
            a = equipmentPoint(prop, 0.55, 0.53),
            b = equipmentPoint(prop, 0.64, 0.8),
            c = equipmentPoint(prop, 0.88, 0.94);
          point = {
            x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x,
            z: (1 - t) ** 2 * a.z + 2 * (1 - t) * t * b.z + t * t * c.z,
          };
          seated = true;
          seatWeight =
            ease((age - platformEnd) / 220) * ease((slideEnd - age) / 220);
          direction = 1;
          stage = "sliding";
        } else {
          point = mix(
            equipmentPoint(prop, 0.88, 0.94),
            landing,
            ease((age - slideEnd) / 600),
          );
          direction = 1;
          stage = "landing";
        }
      } else if (prop.id === "picnic-table") {
        point = equipmentPoint(prop, 0.26, 0.82);
        seated = true;
        direction = 2;
      } else if (prop.id === "trampoline") {
        const station = equipmentPoint(prop, 0.5, 0.49);
        const front = equipmentPoint(prop, 0.5, 1.18);
        const route = slideApproach(prop, origin).slice(0, -1).concat(front);
        exitAt = current.npc ? 7600 : Infinity;
        if (age < 850) {
          point = followPath(route, age / 850);
          direction = point.direction;
          stage = "approaching";
        } else if (age < 1400) {
          const t = (age - 850) / 550;
          point = mix(front, station, ease(t));
          direction = 4;
          lift = Math.sin(t * Math.PI) * 0.62;
          stage = "mounting";
        } else {
          point = station;
          direction = 0;
          lift =
            Math.abs(Math.sin((age - 1400) / 385)) *
            0.8 *
            ease((exitAt - age) / 500);
          stage = "bouncing";
          const trick = current.trick;
          if (trick && time - trick.started < 950) {
            const t = clamp((time - trick.started) / 950);
            lift = Math.sin(t * Math.PI) * 1.35;
            if (trick.kind === "full")
              spinScale = 0.65 + 0.35 * Math.abs(Math.cos(t * Math.PI * 2));
            else
              rotation =
                (trick.kind === "backflip" ? -1 : 1) * Math.PI * 2 * ease(t);
            if (trick.kind === "full") direction = Math.round(t * 8) % 8;
            crouch = true;
          }
        }
      } else if (prop.id === "basketball") {
        const station = equipmentPoint(prop, 0.5, 1.36);
        exitAt = 7600;
        if (age < 850) {
          point = mix(origin, station, ease(age / 850));
          direction = movementDirection(
            station.x - origin.x,
            station.z - origin.z,
          );
          stage = "approaching";
        } else {
          point = station;
          direction = 4;
          lift =
            Math.max(0, Math.sin(((age - 850) / 1800) * Math.PI * 2)) * 0.16;
          stage = "shooting-hoops";
        }
      } else if (prop.id === "climbing-dome") {
        const rungs = [
          [0.48, 0.96],
          [0.46, 0.79],
          [0.53, 0.64],
          [0.47, 0.48],
          [0.52, 0.31],
          [0.5, 0.12],
        ].map(([u, v]) => equipmentPoint(prop, u, v));
        const foot = rungs[0],
          summit = rungs.at(-1);
        exitAt = 10000;
        if (age < 850) {
          point = mix(origin, foot, ease(age / 850));
          direction = movementDirection(foot.x - origin.x, foot.z - origin.z);
          stage = "approaching";
        } else if (age < 5050) {
          // Reach, grip, then pull up one rung; never a walking cycle on ropes.
          const climb = climbRungs(rungs, (age - 850) / 4200);
          point = climb.position;
          climbCycle = climb.cycle;
          direction = 4;
          climbing = true;
          stage = "climbing-net";
        } else if (age < 7550) {
          point = summit;
          direction = 0;
          celebrating = true;
          celebrateTime = age - 5050;
          stage = "summit";
        } else {
          const climb = climbRungs(
            [...rungs].reverse(),
            (age - 7550) / 2450,
            true,
          );
          point = climb.position;
          climbCycle = climb.cycle;
          direction = 4;
          climbing = true;
          stage = "descending-net";
        }
      } else if (prop.id === "roundabout") {
        // Every occupied seat uses the same carousel clock and its own socket.
        const angle = Math.PI / 2 + sharedTime * 0.00075;
        const seatAngle = angle + (current.slot * Math.PI) / 2;
        point = {
          x: prop.x + Math.cos(seatAngle) * 1.05,
          z: prop.z - 0.2 + Math.sin(seatAngle) * 0.42,
        };
        direction = movementDirection(point.x - prop.x, point.z - prop.z + 0.2);
        seated = true;
        tilt = angle;
      }
      const returning = age > exitAt,
        q = ease((age - exitAt) / returnDuration);
      if (seatWeight === null)
        seatWeight = seated
          ? ease(age / 650) * ease((exitAt + 350 - age) / 350)
          : 0;
      if (returning) {
        direction = movementDirection(origin.x - point.x, origin.z - point.z);
        if (returnPath) {
          point = followPath(returnPath, q);
          direction = point.direction;
        } else point = mix(point, origin, q);
        stage = "returning";
      }
      // Boarding eases onto a seat; the slide already has its own approach path.
      if (seated && age < 650) {
        direction = movementDirection(point.x - origin.x, point.z - origin.z);
        point = mix(origin, point, ease(age / 650));
        seated = false;
        stage = "approaching";
      }
      const player = {
        ...point,
        lift,
        direction,
        seated: seated && !returning,
        crouch: crouch && !returning,
        rotation,
        spinScale,
        anchor: seated && !returning ? "hips" : "feet",
        seatWeight,
        moving: ["approaching", "platform", "returning", "landing"].includes(
          stage,
        ),
        climbing: climbing && !returning,
        celebrating: celebrating && !returning,
        climbCycle,
        celebrateTime,
        poseTime: age,
        stage,
      };
      return {
        id: prop.id,
        prop,
        origin,
        elapsed: age,
        tilt,
        slot: current.slot,
        player,
        partner,
        guest,
        done: age >= exitAt + returnDuration,
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
    const riders = activity.riders || [activity];
    const h = p.h * unit,
      w = (h * 294) / 258,
      left = foot.x - w / 2,
      top = foot.y - h;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, w, h);
    for (const ride of riders)
      ctx.rect(
        left + w * (0.235 + (ride.slot || 0) * 0.335),
        top + h * 0.17,
        w * 0.29,
        h * 0.675,
      );
    ctx.clip("evenodd");
    drawProp();
    ctx.restore();
    for (const ride of riders) {
      const offset = (ride.slot || 0) * 0.335;
      const socket = swingSeat(p, ride.tilt, ride.slot);
      const seat = at(socket.x, socket.z);
      const a = equipmentPoint(p, 0.29 + offset, 0.145),
        b = equipmentPoint(p, 0.475 + offset, 0.145);
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
          img.width * (0.235 + offset),
          img.height * 0.72,
          img.width * 0.29,
          img.height * 0.125,
          seat.x - w * 0.145,
          seat.y - h * 0.03,
          w * 0.29,
          h * 0.125,
        );
      drawPerson(ride.player, true, ride);
      ctx.restore();
    }
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
  if (p.id === "roundabout") {
    drawRoundabout(ctx, at, unit, p, activity.tilt, () => {
      for (const ride of [...(activity.riders || [activity])].sort(
        (a, b) => a.player.z - b.player.z,
      ))
        drawPerson(ride.player, true, ride);
    });
    return;
  }
  // A visitor approaching the far side is behind the drawing, not standing
  // on its rooftop. The ladder/platform/slide poses are layered separately.
  const person = activity.player;
  const behind =
    ["approaching", "returning"].includes(person.stage) &&
    person.z < p.z - 0.15 &&
    Math.abs(person.x - p.x) < (p.h * (ratios[p.id] || 1)) / 2;
  if (behind) drawPerson(person, true);
  drawProp();
  if (!behind) drawPerson(person, true);
  if (p.id === "basketball" && activity.player.stage === "shooting-hoops") {
    const beat = ((activity.elapsed - 850) % 1800) / 1800;
    const hand = at(person.x, person.z - 0.8),
      rim = at(p.x, p.z - p.h * 0.61);
    const t = Math.min(1, beat * 1.6),
      position = {
        x: hand.x + (rim.x - hand.x) * t,
        y: hand.y + (rim.y - hand.y) * t - Math.sin(t * Math.PI) * unit * 1.05,
      };
    if (beat > 0.625) position.y += (beat - 0.625) * unit * 2.5;
    ctx.save();
    ctx.fillStyle = "#dc863d";
    ctx.strokeStyle = "#684127";
    ctx.lineWidth = Math.max(1, unit * 0.035);
    ctx.beginPath();
    ctx.arc(position.x, position.y, unit * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(position.x - unit * 0.12, position.y);
    ctx.lineTo(position.x + unit * 0.12, position.y);
    ctx.moveTo(position.x, position.y - unit * 0.12);
    ctx.lineTo(position.x, position.y + unit * 0.12);
    ctx.stroke();
    ctx.restore();
  }
  if (
    p.id === "playhouse" &&
    ["climbing", "platform"].includes(activity.player.stage)
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
    ctx.lineTo(s.x + (p.x - s.x) * 0.25, s.y - unit * 0.17);
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
    ctx.fillRect(
      p.x - unit * 0.12,
      p.y - unit * 0.18,
      unit * 0.24,
      unit * 0.18,
    );
    ctx.fillStyle = "#3caaa1";
    ctx.beginPath();
    ctx.ellipse(
      p.x,
      p.y - unit * 0.18,
      unit * 0.17,
      unit * 0.09,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  };
  // Low hardware is always drawn first; no post or rail can cut through a
  // rider as a depth comparison changes from one frame to another.
  hub();
  seats.forEach(rail);
  drawRider();
  ctx.restore();
}
