import { createSurfRide, surfboard } from "./SurfRide";
import { craftWater } from "./Harbor";
import { isSand } from "./Coast";
import { skyBirds } from "./Sky";
import { characterAsset, activityAsset } from "./Wardrobe";
import appearances from "./Appearances.json";
import sheets from "./SpriteSheets.json";

test("surfboard steers continuously, stops on release, and steps ashore where it reaches land", () => {
  const surf = createSurfRide(),
    origin = { x: surfboard.x - 0.6, z: surfboard.z + 0.4 };
  expect(surf.start(origin, 0)).toBe(true);
  for (let t = 0; t <= 1200; t += 16) surf.update(0.016, t);
  surf.update(0.016, 1216);
  expect(surf.manual()).toBe(true);
  for (let t = 1232; t < 2200; t += 16) {
    const p = surf.update(0.016, t, { x: 1, z: 0 });
    expect(craftWater(p.x, p.z, "surfboard")).toBe(true);
    expect(p.direction).toBe(2);
    expect(p.wave).toBeGreaterThan(0);
  }
  const moving = surf.snapshot();
  expect(surf.update(0.016, 2216)).toMatchObject({
    x: moving.x,
    z: moving.z,
    moving: false,
    wave: 0,
  });
  expect(surf.trick(2250)).toBe(true);
  expect(surf.update(0, 2600).lift).toBeGreaterThan(0);
  expect(surf.steer({ x: 29, z: 23 })).toBe(true);
  let result;
  for (let t = 2650; t < 25000 && surf.active(); t += 16)
    result = surf.update(0.016, t);
  expect(result.done).toBe(true);
  expect(isSand(result.x, result.z)).toBe(true);
  expect(Math.hypot(result.x - origin.x, result.z - origin.z)).toBeGreaterThan(
    4,
  );
  expect(surf.start(result, 26000)).toBe(true);
});
test.each([
  { x: -31.8, z: 0 },
  { x: 31.8, z: 0 },
  { x: 0, z: -32.6 },
])(
  "touch steering to beach $x,$z uses a continuous water route and lands on that shore",
  (target) => {
    const surf = createSurfRide();
    surf.start(surfboard, 0);
    surf.update(0.016, 1200);
    expect(surf.steer(target)).toBe(true);
    let before = surf.snapshot(),
      result;
    for (let t = 1216; t < 45000 && surf.active(); t += 16) {
      result = surf.update(0.016, t);
      expect(Math.hypot(result.x - before.x, result.z - before.z)).toBeLessThan(
        0.22,
      );
      before = result;
    }
    expect(result.done).toBe(true);
    expect(isSand(result.x, result.z)).toBe(true);
    expect(Math.hypot(result.x - target.x, result.z - target.z)).toBeLessThan(
      2,
    );
  },
);
test("keyboard steering ashore ends surfing instead of leaving the rider blocked at the waterline", () => {
  const surf = createSurfRide();
  surf.start(surfboard, 0);
  surf.update(0.016, 1200);
  let result;
  for (let t = 1216; t < 4000 && surf.active(); t += 16)
    result = surf.update(0.016, t, { x: 0, z: -1 });
  expect(result.done).toBe(true);
  expect(isSand(result.x, result.z)).toBe(true);
});
test("all costumes keep their own complete directional activity sheets", () => {
  for (const look of appearances)
    for (const action of [
      "surf",
      "fish-surf",
      "board-ride",
      "board-trick",
      "wake-ride",
      "water-ride",
      "bike-acro",
      "bike-mach",
    ]) {
      expect(characterAsset(look.character, look.id)).toBe(look.asset);
      expect(activityAsset(look.character, look.id, action, sheets)).toBe(
        look.asset + "-" + action,
      );
      expect(sheets[look.asset + "-" + action].rows).toBe(8);
    }
});
test("overhead flocks stay bounded to three or four birds and recur every 30 seconds", () => {
  const center = { x: 0, z: 9 };
  expect(skyBirds(0, center)).toEqual([]);
  expect(skyBirds(6000, center)).toHaveLength(3);
  expect(skyBirds(36000, center)).toHaveLength(4);
  expect(skyBirds(18000, center)).toHaveLength(0);
});
