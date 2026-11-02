import { glassFloats, createFloatHunt } from "./FloatHunt";
import {
  shellSpecies,
  chooseShell,
  createShellSpawns,
  addShell,
  readShells,
  discoveredShells,
} from "./Shells";
import { createBeachActivities, beachStations } from "./BeachActivities";
import { isSand, shoreline } from "./Coast";
import { beachSprites } from "./BeachScene";
import { canStand, findPath, move } from "./navigation";
import { obstacles } from "./config";
import { isOcean } from "./TownLayout";
import { surfEntry } from "./Surf";
import artwork from "./BeachArt.json";

beforeEach(() => localStorage.clear());

test("all 20 floats have distinct published artwork and reachable hiding places", () => {
  expect(glassFloats).toHaveLength(20);
  expect(new Set(glassFloats.map((f) => f.art)).size).toBe(20);
  const hunt = createFloatHunt();
  hunt.start(0, (p) => canStand(p.x, p.z, obstacles));
  expect(hunt.points()).toHaveLength(20);
  for (const float of hunt.points()) {
    expect(artwork[float.art]).toBeDefined();
    if (!canStand(float.x, float.z, obstacles))
      throw new Error(`Blocked float: ${float.id} at ${float.x},${float.z}`);
    expect(findPath({ x: 0, z: 9 }, float, obstacles).length).toBeGreaterThan(
      0,
    );
  }
});
test("float hunt is invisible before activation, reveals all 20 and persists each collection exactly once", () => {
  let hunt = createFloatHunt();
  expect(hunt.points()).toHaveLength(0);
  expect(hunt.collect("float-1")).toBeNull();
  hunt.start(100);
  expect(hunt.points()).toHaveLength(20);
  expect(hunt.collect("float-1").found).toEqual(["float-1"]);
  expect(hunt.collect("float-1")).toBeNull();
  hunt = createFloatHunt();
  expect(hunt.snapshot().active).toBe(true);
  expect(hunt.points()).toHaveLength(19);
  for (const f of hunt.points()) hunt.collect(f.id);
  expect(hunt.snapshot().found).toHaveLength(20);
  hunt.start(1000);
  expect(hunt.points()).toHaveLength(0);
});
test("the beach can be reached through the pier gap, is dry, and preserves a solid fence", () => {
  for (const x of [-26, -12, 12, 26]) {
    expect(isSand(x, 22)).toBe(true);
    expect(isOcean(x, 22)).toBe(false);
    expect(canStand(x, 22, obstacles)).toBe(true);
    expect(
      findPath({ x: 0, z: 9 }, { x, z: 22 }, obstacles).length,
    ).toBeGreaterThan(0);
    expect(canStand(x, shoreline(x) + 0.2, obstacles)).toBe(false);
    expect(isOcean(x, shoreline(x) + 0.2)).toBe(true);
    expect(
      surfEntry({ x, z: shoreline(x) - 0.2 }, 0, (p) =>
        canStand(p.x, p.z, obstacles, false, true),
      ),
    ).not.toBeNull();
  }
  const blocked = move({ x: -18, z: 18 }, 0, 4, obstacles, false);
  expect(blocked.z).toBeLessThan(19.1);
  for (const site of beachStations)
    expect(findPath({ x: 0, z: 9 }, site, obstacles).length).toBeGreaterThan(0);
});
test("50 shell varieties use real artwork, weighted rarities, quantities and persistent guide discoveries", () => {
  expect(shellSpecies).toHaveLength(50);
  expect(shellSpecies.filter((s) => s.rarity === "Super rare")).toHaveLength(1);
  shellSpecies.forEach((s) => expect(artwork[s.art]).toBeDefined());
  expect(chooseShell(() => 0).rarity).toBe("Super rare");
  expect(chooseShell(() => 0.5).rarity).not.toBe("Super rare");
  let counts = addShell({}, "shell-1");
  counts = addShell(counts, "shell-1");
  expect(counts).toEqual({ "shell-1": 2 });
  expect(readShells()).toEqual(counts);
  expect(discoveredShells(counts)).toEqual({ "shell-1": 1 });
});
test("shell pickups on all four shores respawn with a delay and away from the player", () => {
  const spawns = createShellSpawns(() => 0.5),
    player = { x: 0, z: 9 };
  spawns.update(0, player);
  expect(spawns.snapshot()).toHaveLength(24);
  const caught = spawns.snapshot()[0];
  expect(spawns.collect(caught.id, 100)).toBeDefined();
  spawns.update(1000, caught);
  expect(spawns.snapshot()).toHaveLength(23);
  spawns.update(40000, caught);
  expect(spawns.snapshot()).toHaveLength(24);
  const replacement = spawns.snapshot().find((s) => s.id === caught.id);
  expect(
    Math.hypot(replacement.x - caught.x, replacement.z - caught.z),
  ).toBeGreaterThan(4);
  spawns.snapshot().forEach((s) => expect(isSand(s.x, s.z)).toBe(true));
});
test("footprints expire, remain bounded and do not appear on the pier or water; building and kites finish", () => {
  const activities = createBeachActivities();
  for (let i = 0; i < 200; i++)
    activities.update(i * 20, { x: -24 + (i % 40) * 0.5, z: 22 }, 2, true);
  expect(activities.snapshot(4000).footprints.length).toBeLessThanOrEqual(96);
  activities.update(20000, { x: 0, z: 27 }, 0, true);
  expect(activities.snapshot(20000).footprints).toHaveLength(0);
  activities.build(20000);
  expect(activities.snapshot(20000).castle).toBe(0);
  activities.update(23500, { x: -11, z: 22 }, 6, false);
  expect(activities.snapshot(23500).castle).toBe(0.5);
  expect(activities.busy()).toBe(true);
  activities.update(27000, { x: -11, z: 22 }, 6, false);
  expect(activities.snapshot(27000).castle).toBe(1);
  expect(activities.busy()).toBe(false);
  activities.fly(25000);
  expect(activities.snapshot(25000).kite).not.toBeNull();
  activities.update(41000, { x: 12, z: 22 }, 0, false);
  expect(activities.snapshot(41000).kite).toBeNull();
  expect(
    beachSprites({ worldTime: 42000, beach: activities.snapshot(42000) }).find(
      (s) => s.id === "sandcastle",
    ).art,
  ).toBe("castle-stage-7");
});
