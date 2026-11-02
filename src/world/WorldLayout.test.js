import {
  doorArrival,
  doorApproach,
  roomEntrance,
  enteringBuilding,
  leavingRoom,
  roomBounds,
} from "./WorldLayout";
import { buildings, obstacles } from "./config";
import { canStand } from "./navigation";
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
  expect(canStand(10, 8, [], true)).toBe(true);
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
