import { duckRoutine, gooseRoutine } from "./Ducks";
import { npcCostume } from "./Heroes";
import { residents, animals } from "./config";
import { movementDirection } from "./animation";
import { walkSpeed } from "./Movement";
import { pond } from "./TownLayout";
import { isWater } from "./Surf";
import { children, createResidentRoute } from "./ResidentRoutes";

let routes;
function getRoutes() {
  if (!routes) {
    const seed = Math.floor(Math.random() * 1000000);
    routes = residents.map((r) => ({ ...r, seed, itineraries: new Map() }));
  }
  return routes;
}
// An actor's clock can pause for tricks or a bicycle ride. Each itinerary starts
// and ends at the same safe point, so changing plans cannot teleport anybody.
export function roamingPeople(time, clock = (id, t) => t) {
  return getRoutes().map((r, index) => {
    const actorTime = clock(r.id, time);
    let elapsed = Math.max(0, actorTime / 1000 + index * 3.3),
      variant = 0,
      pastDistance = 0;
    let route;
    for (;;) {
      // Skip whole cached cycles, keeping long-running visits constant-cost.
      if (variant === 0 && r.itineraries.size === 3) {
        const all = [...r.itineraries.values()];
        const total = all.reduce((sum, item) => sum + item.duration, 0);
        const cycles = total ? Math.floor(elapsed / total) : 0;
        elapsed -= cycles * total;
        pastDistance +=
          cycles * all.reduce((sum, item) => sum + item.distance, 0);
      }
      if (!r.itineraries.has(variant))
        r.itineraries.set(variant, createResidentRoute(r.id, variant, r.seed));
      route = r.itineraries.get(variant);
      if (!route.duration || elapsed < route.duration) break;
      elapsed -= route.duration;
      pastDistance += route.distance;
      variant = (variant + 1) % 3;
    }
    const segment =
      route.segments.find((s) => elapsed < s.start + s.seconds) ||
      route.segments[0];
    if (!segment) return { ...r, moving: false, direction: 0, time: 0 };
    const local = elapsed - segment.start;
    let walked = 0;
    if (!segment.playing) {
      const { ramp, peak, length } = segment;
      walked =
        local < ramp
          ? (peak * local * local) / (2 * ramp)
          : local > segment.seconds - ramp
            ? length - (peak * (segment.seconds - local) ** 2) / (2 * ramp)
            : peak * (local - ramp / 2);
    }
    const t = segment.length
      ? Math.max(0, Math.min(1, walked / segment.length))
      : 0;
    const x = segment.from.x + (segment.to.x - segment.from.x) * t,
      z = segment.from.z + (segment.to.z - segment.from.z) * t;
    const fishing = segment.activity === "fishing";
    return {
      id: r.id,
      outfit: npcCostume(r.id, actorTime),
      x,
      z,
      room: segment.room || null,
      surfing: !!segment.water && isWater(x, z),
      moving: !segment.playing,
      direction: segment.direction,
      playing: segment.activity === "playground" && children.includes(r.id),
      activity: segment.activity,
      wantsBike: segment.bike,
      activityId: `${Math.round((actorTime / 1000 + index * 3.3 - elapsed) * 1000)}:${segment.start.toFixed(3)}`,
      action: fishing ? "fish" : null,
      fishingTarget: segment.target,
      fishingElapsed: local * 1000,
      variant,
      time: fishing
        ? Math.min(local * 1000, 481)
        : ((pastDistance + segment.walked + walked) / walkSpeed) * 1000,
    };
  });
}
const animalIndex = new Map(animals.map((a, i) => [a.id, i]));
export function roamingAnimals(time, visibleSpiders = null) {
  const ducks = animals.filter((a) => a.kind === "duck");
  return animals
    .filter((a) => !visibleSpiders || !a.chance || visibleSpiders.has(a.id))
    .map((a) => {
      const i = animalIndex.get(a.id);
      if (a.kind === "goose") {
        return { ...a, ...gooseRoutine(time, a.id) };
      }
      if (a.kind === "duck")
        return {
          ...a,
          ...duckRoutine(
            time,
            ducks.findIndex((d) => d.id === a.id),
            ducks.length,
          ),
        };
      const t = time / 2400 + i * 1.7,
        water = a.kind !== "dog" && a.kind !== "land";
      const radius = a.chance ? 0.8 : 1.8,
        depth = a.chance ? 0.6 : 1.4;
      const x = water
        ? pond.x + Math.sin(t) * pond.rx * 0.76
        : a.x + Math.sin(t) * radius;
      const z = water
        ? pond.z + Math.cos(t) * pond.rz * 0.7
        : a.z + Math.cos(t) * depth;
      return {
        ...a,
        x,
        z,
        moving: true,
        direction: movementDirection(
          Math.cos(t) * (water ? pond.rx * 0.76 : radius),
          -Math.sin(t) * (water ? pond.rz * 0.7 : depth),
        ),
        time: time * 0.7,
      };
    });
}
