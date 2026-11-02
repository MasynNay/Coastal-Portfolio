import { isWater, surfEntry, axolotlColors } from "./Surf";
import { isOcean, pond } from "./TownLayout";
import { canStand, move, findPath } from "./navigation";
import { obstacles } from "./config";
test("the ocean surrounds the town and the pier remains dry land", () => {
  for (const [x, z] of [
    [-35, 0],
    [35, -5],
    [0, -36],
    [0, 33],
    [-12, 25],
  ])
    expect(isOcean(x, z)).toBe(true);
  expect(isOcean(0, 27)).toBe(false);
  expect(isOcean(27, 22)).toBe(false); // The new south beach is dry land.
});
test("walking cannot enter pond or ocean; an axolotl can cross both", () => {
  for (const [x, z] of [
    [0, 0],
    [-10, 25],
  ]) {
    expect(canStand(x, z, obstacles)).toBe(false);
    expect(canStand(x, z, obstacles, false, true)).toBe(true);
  }
  const walking = move(
    {
      x: pond.x,
      z: pond.z + pond.rz + 0.05,
    },
    0,
    -1,
    obstacles,
    false,
    false,
  );
  const surfing = move(
    {
      x: pond.x,
      z: pond.z + pond.rz + 0.05,
    },
    0,
    -1,
    obstacles,
    false,
    true,
  );
  expect(walking.z).toBeCloseTo(pond.z + pond.rz + 0.05);
  expect(surfing.z).toBeLessThan(pond.z + pond.rz);
});
test("E can find nearby water, but never enables a remote mount", () => {
  const canEnter = (p) => canStand(p.x, p.z, obstacles, false, true);
  const entry = surfEntry(
    {
      x: pond.x,
      z: pond.z + pond.rz + 0.6,
    },
    4,
    canEnter,
  );
  expect(entry).not.toBe(null);
  expect(isWater(entry.x, entry.z)).toBe(true);
  expect(
    surfEntry(
      {
        x: 0,
        z: 9,
      },
      4,
      canEnter,
    ),
  ).toBe(null);
});
test("returning across a shoreline gives an unambiguous land position", () => {
  const next = move(
    {
      x: pond.x,
      z: pond.z + pond.rz - 0.1,
    },
    0,
    1,
    obstacles,
    false,
    true,
  );
  expect(isWater(next.x, next.z)).toBe(false);
  expect(canStand(next.x, next.z, obstacles, false, false)).toBe(true);
  expect(
    findPath(
      {
        x: pond.x,
        z: pond.z + pond.rz + 0.6,
      },
      {
        x: 0,
        z: 0,
      },
      obstacles,
    ),
  ).toEqual([]);
});
test("every family member has a different axolotl color", () => {
  const names = ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"];
  expect(new Set(names.map((n) => axolotlColors[n])).size).toBe(5);
});
test("the outside ring is the walking boundary; mounting targets actual blue water", () => {
  const { isWaterSurface } = require("./Surf");
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
    const bank = {
      x: pond.x + Math.cos(angle) * (pond.rx + pond.bank - 0.05),
      z: pond.z + Math.sin(angle) * (pond.rz + pond.bank - 0.05),
    };
    expect(canStand(bank.x, bank.z, obstacles)).toBe(false);
    expect(canStand(bank.x, bank.z, obstacles, false, true)).toBe(true);
  }
  const start = { x: pond.x, z: pond.z + pond.rz + pond.bank + 0.1 };
  const mount = surfEntry(start, 4, (p) =>
    canStand(p.x, p.z, obstacles, false, true),
  );
  expect(mount).not.toBe(null);
  expect(isWaterSurface(mount.x, mount.z)).toBe(true);
});
