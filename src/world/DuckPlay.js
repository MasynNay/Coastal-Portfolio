import { canStand } from "./navigation";
import { obstacles } from "./config";
import { isWater } from "./Surf";
import { waterfowlRoutine } from "./Ducks";
import { movementDirection } from "./animation";
import { animalPath, pathLength, sampleAnimalPath } from "./AnimalPaths";
import { smoothPath } from "./Paths";

// Ducks and the goose couple share one activity clock, effects and safe paths.
// A group has one player route and a separate position for every participating
// bird. Travel/character changes cancel the whole group together.
export function createDuckPlay(random = Math.random) {
  let activity = null,
    last = null;
  const returning = new Map();
  function returnToRoutine(member, duck, time) {
    let duration = 1800,
      route;
    for (let i = 0; i < 4; i++) {
      route = animalPath(duck, waterfowlRoutine(time + duration, member), true);
      if (!route) break;
      duration = Math.max(300, (pathLength(route) / 2.5) * 1000);
    }
    const final = animalPath(
      duck,
      waterfowlRoutine(time + duration, member),
      true,
    );
    if (final)
      returning.set(member.id, { route: final, started: time, duration });
  }
  function reconnect(result, time) {
    for (const member of result?.members || [])
      returnToRoutine(member, member.duck, time);
  }
  // Both geese follow one center route with separate side-by-side lanes.
  // Fixed lateral spacing also survives tight turns and the end of a chase.
  function chasePoint(route, progress, index, lead, spacing) {
    const point = sampleAnimalPath(route, Math.min(1, progress + lead));
    return { ...point, x: point.x + (spacing ? (index - 0.5) * spacing : 0) };
  }
  function clearFormation(route, joins, members, lead, spacing) {
    if (members.length < 2) return true;
    for (let step = 0; step <= 40; step++) {
      for (const joining of [true, false]) {
        const birds = members.map((_, i) =>
          joining
            ? sampleAnimalPath(joins[i], step / 40)
            : chasePoint(route, step / 40, i, lead, spacing),
        );
        if (
          birds.some((p) => !canStand(p.x, p.z, obstacles, false, true)) ||
          Math.hypot(birds[0].x - birds[1].x, birds[0].z - birds[1].z) < 0.6
        )
          return false;
      }
    }
    return true;
  }
  return {
    start(id, kind, player, duck, surfing = false, companions = []) {
      if (!duck || !["feed", "pet", "chase"].includes(kind)) return false;
      const origin = { x: player.x, z: player.z };
      let members = [duck, ...companions].map((member) => ({
        ...member,
        start: { x: member.x, z: member.z, direction: member.direction || 0 },
      }));
      let route, joins, lead, spacing;
      const total = kind === "chase" ? 5000 : kind === "feed" ? 2000 : 1400;
      if (kind === "chase") {
        const group = members.length > 1;
        const candidates = Array.from({ length: 20 }, (_, i) => {
          const angle = (i / 20 + random() * 0.1) * Math.PI * 2,
            r = 2.3 + random() * 1.5;
          return {
            x: origin.x + Math.sin(angle) * r,
            z: origin.z + Math.cos(angle) * r,
          };
        }).filter((p) => canStand(p.x, p.z, obstacles, false, surfing));
        outer: for (let i = 0; i < candidates.length - 1; i++) {
          // A group needs a wide loop, rather than two adjacent destinations
          // that make a narrow out-and-back turn and crowd the trailing bird.
          const stops = group
            ? [
                candidates[i],
                candidates[
                  (i + Math.floor(candidates.length / 3)) % candidates.length
                ],
                candidates[
                  (i + Math.floor((candidates.length * 2) / 3)) %
                    candidates.length
                ],
                origin,
              ]
            : [candidates[i], candidates[i + 1], origin];
          const loop = [origin];
          let from = origin,
            valid = true;
          for (const target of stops) {
            const leg = animalPath(from, target, surfing);
            if (!leg) {
              valid = false;
              break;
            }
            loop.push(
              ...(group
                ? smoothPath(from, leg.slice(1), obstacles, false, surfing)
                : leg.slice(1)),
            );
            from = target;
          }
          if (!valid) continue;
          const length = pathLength(loop);
          if (length < 5 || length > 24) continue;
          lead = group
            ? Math.min(0.35, 1.6 / length)
            : Math.min(0.15, 1 / length);
          spacing = group ? 1.15 : 0;
          const candidateLead = lead,
            candidateSpacing = spacing;
          // Try both orders so their short approach paths never cross.
          for (const order of group
            ? [members, [...members].reverse()]
            : [members]) {
            const approaches = order.map((m, j) =>
              animalPath(
                m.start,
                chasePoint(loop, 0, j, candidateLead, candidateSpacing),
                true,
              ),
            );
            if (
              approaches.some((p) => !p) ||
              !clearFormation(loop, approaches, order, lead, spacing)
            )
              continue;
            members = order;
            route = loop;
            joins = approaches;
            break outer;
          }
        }
        if (!route) return false;
      }
      for (const member of members) returning.delete(member.id);
      last = null;
      activity = {
        id,
        kind,
        origin,
        members,
        surfing,
        elapsed: 0,
        total,
        route,
        joins,
        lead,
        spacing,
      };
      return true;
    },
    update(dt, time) {
      if (!activity) return null;
      const a = activity;
      a.elapsed = Math.min(a.total, a.elapsed + dt * 1000);
      const t = Math.max(0, (a.elapsed - 750) / 4250);
      const player =
        a.kind === "chase" && a.elapsed >= 750
          ? sampleAnimalPath(a.route, t)
          : { ...a.origin };
      const members = a.members.map((member, i) => {
        let duck = {
          ...member.start,
          moving: a.kind === "feed",
          time: a.elapsed,
          direction: movementDirection(
            a.origin.x - member.start.x,
            a.origin.z - member.start.z,
          ),
        };
        if (a.kind === "chase") {
          duck =
            a.elapsed < 750
              ? sampleAnimalPath(a.joins[i], a.elapsed / 750)
              : chasePoint(a.route, t, i, a.lead, a.spacing);
          duck = { ...duck, moving: true, time: a.elapsed };
        }
        duck.inWater = isWater(duck.x, duck.z);
        return { ...member, duck };
      });
      const done = a.elapsed >= a.total;
      last = {
        id: a.id,
        name: members
          .map((m) => m.name)
          .filter(Boolean)
          .join(" and "),
        kind: a.kind,
        player,
        members,
        duck: members[0].duck,
        elapsed: a.elapsed,
        time,
        progress: a.elapsed / a.total,
        hearts: a.kind === "pet" && !done,
        peas: a.kind === "feed" && !done,
        done,
        surfing: a.surfing && isWater(player.x, player.z),
      };
      if (done) {
        reconnect(last, time);
        activity = null;
      }
      return last;
    },
    active: () => !!activity,
    snapshot: () => last,
    resume(duck, time) {
      const r = returning.get(duck.id);
      if (!r) return duck;
      const progress = (time - r.started) / r.duration;
      if (progress >= 1) {
        returning.delete(duck.id);
        return duck;
      }
      const p = sampleAnimalPath(r.route, progress);
      return { ...duck, ...p, moving: true, inWater: isWater(p.x, p.z) };
    },
    cancel(time = last?.time || 0) {
      if (last && !last.done) reconnect(last, time);
      activity = null;
      last = null;
    },
  };
}
