import { createFloatHunt } from "./FloatHunt";
import { pond } from "./TownLayout";
import { canStand, move, findPath } from "./navigation";
import { buildings, obstacles, roomObstacles } from "./config";
test("every fast-travel destination lands safely outside its building", () => {
  buildings.forEach((b) =>
    expect(canStand(b.x, b.z + 5.2, obstacles)).toBe(true),
  );
});
test("walls, water and island edge block movement", () => {
  expect(canStand(buildings[0].x, buildings[0].z, obstacles)).toBe(false);
  expect(canStand(0, 0, obstacles)).toBe(false);
  expect(canStand(34, 0, obstacles)).toBe(false);
  expect(
    move(
      {
        x: pond.x,
        z: pond.z + pond.rz + 0.05,
      },
      0,
      -1,
      obstacles,
    ),
  ).toEqual({
    x: pond.x,
    z: pond.z + pond.rz + 0.05,
  });
});
test("click-to-walk routes around the pond without crossing collisions", () => {
  const path = findPath(
    {
      x: 0,
      z: 8,
    },
    {
      x: 0,
      z: -8,
    },
    obstacles,
  );
  expect(path.some((p) => Math.abs(p.x) > 2)).toBe(true);
  path.forEach((p) => expect(canStand(p.x, p.z, obstacles)).toBe(true));
  expect(path[path.length - 1]).toEqual({
    x: 0,
    z: -8,
  });
});
test("blocked goals return no route and room boundaries contain the player", () => {
  expect(
    findPath(
      {
        x: 0,
        z: 8,
      },
      {
        x: 0,
        z: 0,
      },
      obstacles,
    ),
  ).toEqual([]);
  expect(canStand(13, 0, [], true)).toBe(false);
  expect(
    findPath(
      {
        x: 0,
        z: 4,
      },
      {
        x: -2,
        z: 0,
      },
      [],
      true,
    ).length,
  ).toBeGreaterThan(0);
});
test("every doorway and glass float is reachable from the plaza", () => {
  const hunt = createFloatHunt();
  hunt.start(0, (p) => canStand(p.x, p.z, obstacles));
  [
    ...buildings.map((b) => ({
      x: b.x,
      z: b.z + 5.2,
    })),
    ...hunt.points(),
  ].forEach((goal) => {
    expect(
      findPath(
        {
          x: 0,
          z: 9,
        },
        goal,
        obstacles,
      ).length,
    ).toBeGreaterThan(0);
  });
});
test("room furniture blocks the desk but leaves its information point reachable", () => {
  expect(canStand(0, -5.2, roomObstacles, true)).toBe(false);
  expect(
    findPath(
      {
        x: 0,
        z: 7.8,
      },
      {
        x: 0,
        z: -3.9,
      },
      roomObstacles,
      true,
    ).length,
  ).toBeGreaterThan(0);
});
test("a late movement frame cannot tunnel through a narrow wall", () => {
  const next = move(
    {
      x: 0,
      z: 0,
    },
    4,
    0,
    [
      {
        x: 2,
        z: 0,
        w: 0.3,
        d: 4,
      },
    ],
  );
  expect(next.x).toBeLessThan(1.5);
});
