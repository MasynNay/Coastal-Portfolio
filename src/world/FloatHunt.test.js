import { createFloatHunt } from "./FloatHunt";
import { canStand } from "./navigation";
import { buildings, obstacles } from "./config";
import { isSand } from "./Coast";
beforeEach(() => localStorage.clear());
test("fresh hunts redistribute 20 reachable floats across all four beaches and preserve lifetime discoveries", () => {
  let seed = 816;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const safe = (p) =>
    canStand(p.x, p.z, obstacles) &&
    !buildings.some(
      (b) => Math.abs(p.x - b.x) < 7 && p.z > b.z - 9 && p.z < b.z + 4.5,
    );
  const hunt = createFloatHunt(random);
  expect(hunt.start(100, safe)).toBe(true);
  const first = hunt.points();
  expect(first.length).toBe(20);
  expect(first.every(safe)).toBe(true);
  for (const edge of [
    (p) => p.z < -29.5,
    (p) => p.z > 20,
    (p) => p.x < -28.5 && p.z >= -29.5 && p.z <= 20,
    (p) => p.x > 28.5 && p.z >= -29.5 && p.z <= 20,
  ])
    expect(
      first.filter((p) => isSand(p.x, p.z) && edge(p)).length,
    ).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < 20; i++)
    for (let j = i + 1; j < 20; j++)
      expect(
        Math.hypot(first[i].x - first[j].x, first[i].z - first[j].z),
      ).toBeGreaterThan(2.8);
  hunt.collect(first[0].id);
  const restored = createFloatHunt(random);
  restored.start(1000, safe);
  expect(restored.points()).toEqual(hunt.points());
  expect(restored.snapshot().found.length).toBe(1);
  restored.start(2000, safe, true);
  expect(restored.points().length).toBe(20);
  expect(restored.points()).not.toEqual(first);
  expect(restored.snapshot().found).toEqual([]);
  expect(restored.snapshot().discovered).toEqual([first[0].id]);
});

test("random hiding places keep their click-to-walk grid nodes clear too", () => {
  const { floatLocations } = require("./FloatHunt");
  let seed = 394;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let run = 0; run < 20; run++) {
    const places = floatLocations(random, (p) => canStand(p.x, p.z, obstacles));
    expect(places).toHaveLength(20);
    expect(
      places.every((p) =>
        canStand(Math.round(p.x), Math.round(p.z), obstacles),
      ),
    ).toBe(true);
  }
});
