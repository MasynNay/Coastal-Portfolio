import { createWaterRide } from "./WaterRides";
import {
  craftWater,
  oceanRoute,
  waterRoute,
  sampleWaterRoute,
  watercraft,
} from "./Harbor";
import { canStand } from "./navigation";
import sheets from "./SpriteSheets.json";
import { movementDirection, spriteFrame } from "./animation";

test("the sailboat uses the painted heading for all eight movement directions", () => {
  const sheet = sheets[watercraft[0].art];
  const headings = [
    [0, 1], // South
    [1, 1],
    [1, 0], // East
    [1, -1],
    [0, -1], // North
    [-1, -1],
    [-1, 0], // West
    [-1, 1],
  ];
  expect(sheet.rows).toBe(headings.length);
  expect(watercraft[0].cockpit).toHaveLength(headings.length);
  for (const [row, [x, z]] of headings.entries())
    expect(spriteFrame(sheet, movementDirection(x, z), true, 500)).toEqual({
      row,
      column: 0,
      flip: false,
    });
});

test("the boat makes a smooth ocean-only lap on all four sides and returns its rider to the exact origin", () => {
  const ride = createWaterRide(),
    origin = { x: -2.25, z: 27 };
  expect(ride.start("boat", origin, false, 0, "mi-shell")).toBe(true);
  let previous = ride.snapshot(),
    sides = new Set(),
    last;
  for (let time = 16; time < 40000 && ride.active(); time += 16) {
    last = ride.update(0.016, time);
    if (last.done) break;
    expect(craftWater(last.x, last.z, "boat")).toBe(true);
    expect(Math.hypot(last.x - previous.x, last.z - previous.z)).toBeLessThan(
      0.28,
    );
    if (last.x < -32) sides.add("west");
    if (last.x > 32) sides.add("east");
    if (last.z < -32) sides.add("north");
    if (last.z > 32) sides.add("south");
    previous = last;
  }
  expect(sides.size).toBe(4);
  expect(last).toMatchObject({ ...origin, surfing: false, done: true });
  expect(ride.active()).toBe(false);
});
test("jet-ski input stops on release, never reaches land, and has two animated tricks with a cooldown", () => {
  const ride = createWaterRide();
  ride.start("jetski", { x: 2.25, z: 27 }, false, 0);
  let time = 0;
  for (let i = 0; i < 100; i++) {
    time += 16;
    const p = ride.update(0.016, time, { x: 0, z: -1 });
    expect(craftWater(p.x, p.z, "jetski")).toBe(true);
  }
  const p = ride.snapshot();
  expect(ride.update(0.016, time + 16)).toMatchObject({
    x: p.x,
    z: p.z,
    moving: false,
  });
  expect(ride.trick(time)).toBe(true);
  expect(ride.update(0, time + 450).lift).toBeGreaterThan(1);
  expect(ride.trick(time + 100)).toBe(false);
  expect(ride.trick(time + 1900)).toBe(true);
  expect(ride.update(0, time + 2350).spin).toBeCloseTo(Math.PI);
});
test("return routing goes around the island and the pier, and cancellation restores surf state", () => {
  for (const start of [
    { x: -37, z: -35 },
    { x: 37, z: -35 },
    { x: 0, z: -36 },
    { x: -4, z: 32 },
  ]) {
    const path = oceanRoute(start, watercraft[1], "jetski");
    expect(path).not.toBe(null);
    const route = waterRoute(path, "jetski");
    for (let d = 0; d < route.length; d += 0.2) {
      const p = sampleWaterRoute(route, d);
      expect(craftWater(p.x, p.z, "jetski")).toBe(true);
    }
  }
  const ride = createWaterRide(),
    origin = { x: 7, z: 29 };
  ride.start("jetski", origin, true, 0);
  expect(ride.cancel()).toEqual({ ...origin, surfing: true });
  expect(ride.active()).toBe(false);
});
test("parked hulls are solid and all five family members have complete directional seated poses", () => {
  for (const c of watercraft)
    expect(canStand(c.x, c.z - 0.7, [], false, true)).toBe(false);
  for (const name of ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"])
    expect(sheets[name + "-water-ride"]).toMatchObject({
      rows: 8,
      drawn: true,
      columns: 17,
      canonicalDirections: true,
      layout: "eight",
    });
  for (const name of ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"]) {
    const sheet = sheets[name + "-water-ride"];
    for (let direction = 0; direction < 8; direction++)
      for (let col = 0; col < sheet.cycleFrames; col++)
        expect(
          spriteFrame(sheet, direction, true, col * sheet.frameMs).row,
        ).toBeLessThan(sheet.rows);
  }
});
test("touch steering and returning navigate around land without losing the rider", () => {
  const ride = createWaterRide(),
    origin = { x: 2.25, z: 27 };
  ride.start("jetski", origin, false, 0);
  const target = { x: -36, z: -35 };
  expect(ride.steer(target)).toBe(true);
  let time = 0;
  for (let i = 0; i < 1000; i++) {
    time += 16;
    const p = ride.update(0.016, time);
    expect(craftWater(p.x, p.z, "jetski")).toBe(true);
  }
  expect(
    Math.hypot(ride.snapshot().x - target.x, ride.snapshot().z - target.z),
  ).toBeLessThan(0.3);
  expect(ride.return(time)).toBe(true);
  const returning = [];
  for (let i = 0; i < 2000 && ride.active(); i++) {
    time += 16;
    const p = ride.update(0.016, time);
    if (!p.done) returning.push(p);
  }
  expect(returning.length).toBeGreaterThan(0);
  for (const p of returning) expect(craftWater(p.x, p.z, "jetski")).toBe(true);
  expect(ride.snapshot()).toMatchObject({
    ...origin,
    done: true,
    surfing: false,
  });
});

test("a jet-ski trick preserves held movement, and the boat guest follows the same safe water route", () => {
  const ski = createWaterRide();
  ski.start("jetski", { x: 2.25, z: 27 }, false, 0);
  ski.trick(0);
  const a = ski.update(0.1, 100, { x: 1, z: 0 }),
    b = ski.update(0.1, 200, { x: 1, z: 0 });
  expect(b.x).toBeGreaterThan(a.x);
  expect(b.lift).toBeGreaterThan(0);
  const boat = createWaterRide();
  boat.start("boat", { x: -2.25, z: 27 }, false, 0, "fallyn", "masyn");
  let flips = 0;
  const guests = [];
  for (let t = 16; t < 30000 && boat.active(); t += 16) {
    const p = boat.update(0.016, t);
    if (p.wakeboarder) {
      guests.push(p.wakeboarder);
      if (p.wakeboarder.lift > 1) flips++;
    }
  }
  expect(guests.length).toBeGreaterThan(0);
  for (const p of guests) {
    expect(p.id).toBe("masyn");
    expect(craftWater(p.x, p.z, "boat")).toBe(true);
  }
  expect(flips).toBeGreaterThan(10);
});
