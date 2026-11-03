import {
  createRoomInteractions,
  isLoveOffering,
  loveLight,
  lodgeChests,
} from "./RoomInteractions";

test("room secrets follow their artwork and restored discoveries persist", () => {
  const rooms = createRoomInteractions();
  expect(rooms.points("lodge")).toEqual([lodgeChests]);
  expect(lodgeChests.x).toBeCloseTo(8.33, 1);
  expect(rooms.points("home")).toEqual([]);
  expect(rooms.revealLove()).toBe(true);
  expect(rooms.revealLove()).toBe(false);
  expect(rooms.points("home")).toEqual([loveLight]);
  expect(createRoomInteractions(["love-letter"]).points("home")).toEqual([
    loveLight,
  ]);
  expect(rooms.points("skills")).toEqual([]);
});

test("only Mi Shell's nearby money offering toward the blue light unlocks the letter", () => {
  const actor = {
    id: "mi-shell",
    x: loveLight.x,
    z: loveLight.z + 2,
    direction: 4,
  };
  expect(isLoveOffering("home", actor, { kind: "money" })).toBe(true);
  expect(
    isLoveOffering("home", { ...actor, direction: 0 }, { kind: "money" }),
  ).toBe(false);
  expect(
    isLoveOffering("home", { ...actor, z: actor.z + 5 }, { kind: "money" }),
  ).toBe(false);
  expect(isLoveOffering("lodge", actor, { kind: "money" })).toBe(false);
  expect(
    isLoveOffering("home", { ...actor, id: "masyn" }, { kind: "money" }),
  ).toBe(false);
  expect(isLoveOffering("home", actor, { kind: "wand" })).toBe(false);
  expect(isLoveOffering("home", actor, null)).toBe(false);
});
