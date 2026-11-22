import {
  doorArrival,
  doorApproach,
  roomEntrance,
  enteringBuilding,
  leavingRoom,
  roomBounds,
  buildingObstacle,
  buildingHeight,
} from "./WorldLayout";
import { buildings, obstacles, roomObstacles } from "./config";
import { canStand, findPath, move } from "./navigation";
import places from "./PlaceArt.json";

test("all six full facades block their front corners and side edges without closing the doorway", () => {
  for (const b of buildings) {
    const art = places["building-" + b.id],
      halfWidth = (buildingHeight(b) * art.width) / art.height / 2,
      front = b.z + 3.1,
      blocker = buildingObstacle(b);
    for (const side of [-1, 1]) {
      const x = b.x + side * (halfWidth - 0.05);
      // These strips used to lie outside the shrunken collision rectangle.
      expect(canStand(x, front - 0.05, [blocker])).toBe(false);
      expect(canStand(x, front - 1, [blocker])).toBe(false);
      const stopped = move({ x, z: front + 1 }, 0, -2, [blocker]);
      expect(stopped.z).toBeGreaterThanOrEqual(front + 0.4);
      const corner = { x: b.x + side * (halfWidth + 0.31), z: front + 0.31 };
      // A diagonal can round the corner outside the circular foot clearance.
      expect(canStand(corner.x, corner.z, [blocker])).toBe(true);
      expect(canStand(corner.x - side * 0.1, corner.z - 0.1, [blocker])).toBe(
        false,
      );
    }
    const arrival = doorArrival(b),
      door = doorApproach(b);
    const steps = Math.ceil((arrival.z - door.z) / 0.1);
    for (let i = 0; i <= steps; i++)
      expect(
        canStand(
          b.x,
          arrival.z + ((door.z - arrival.z) * i) / steps,
          obstacles,
        ),
      ).toBe(true);
    expect(findPath(arrival, door, obstacles).length).toBeGreaterThan(0);
  }
});

test("a clear fractional destination beside a facade remains reachable when its rounded square is blocked", () => {
  const b = buildings.find((home) => home.id === "skills"),
    blocker = buildingObstacle(b),
    target = { x: blocker.w / 2 + 0.45, z: b.z },
    start = { x: blocker.w / 2 + 2, z: b.z };
  expect(canStand(target.x, target.z, [blocker])).toBe(true);
  expect(canStand(Math.round(target.x), Math.round(target.z), [blocker])).toBe(
    false,
  );
  const path = findPath(start, target, [blocker]);
  expect(path[path.length - 1]).toEqual(target);
  let previous = start;
  for (const point of path) {
    const distance = Math.hypot(point.x - previous.x, point.z - previous.z),
      steps = Math.ceil(distance / 0.05);
    for (let i = 1; i <= steps; i++)
      expect(
        canStand(
          previous.x + ((point.x - previous.x) * i) / steps,
          previous.z + ((point.z - previous.z) * i) / steps,
          [blocker],
        ),
      ).toBe(true);
    previous = point;
  }
});
test("every doorway can be walked into from the arrival point, without automatically re-entering after exit", () => {
  for (const b of buildings) {
    const arrival = doorArrival(b),
      door = doorApproach(b);
    expect(canStand(door.x, door.z, obstacles)).toBe(true);
    expect(enteringBuilding(door, arrival, buildings)).toBe(b.id);
    expect(enteringBuilding(arrival, door, buildings)).toBe(null);
    expect(
      enteringBuilding(
        {
          ...door,
          x: b.x + 2,
        },
        arrival,
        buildings,
      ),
    ).toBe(null);
  }
});
test("expanded rooms have a safe entrance and a walk-out exit", () => {
  expect(roomBounds.halfWidth).toBeGreaterThan(10);
  for (const { id } of buildings) {
    expect(canStand(roomEntrance.x, roomEntrance.z, roomObstacles, id)).toBe(
      true,
    );
    expect(canStand(10, 8, roomObstacles, id)).toBe(false);
    expect(canStand(11.5, 0, roomObstacles, id)).toBe(false);
    expect(canStand(0, -6.8, roomObstacles, id)).toBe(false);
    expect(
      findPath(roomEntrance, { x: 0, z: 10 }, roomObstacles, id).length,
    ).toBeGreaterThan(0);
  }
  expect(leavingRoom(roomEntrance, roomEntrance)).toBe(false);
  expect(
    leavingRoom(
      {
        x: 0,
        z: 9.8,
      },
      roomEntrance,
    ),
  ).toBe(true);
  expect(
    leavingRoom(
      {
        x: 3,
        z: 9.8,
      },
      roomEntrance,
    ),
  ).toBe(false);
});
