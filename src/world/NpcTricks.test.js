import { createNpcTricks, trickPose, passingDuration } from "./NpcTricks";
const target = { id: "ezra", x: 2, z: 0, direction: 6 },
  actor = { x: 0, z: 0, direction: 0 };
test.each(["spell", "pokeball", "arrow"])(
  "%s aims at a nearby eligible NPC and freezes its route clock, then resumes without a teleport",
  (kind) => {
    const t = createNpcTricks(),
      effect = t.start({ ...actor, kind }, [target], "masyn", 1000);
    expect(effect.target.id).toBe("ezra");
    expect(effect.direction).toBe(2);
    expect(t.actorTime("ezra", 1700)).toBe(1000);
    expect(t.actorTime("fallyn", 1700)).toBe(1700);
    const state = t.snapshot(1700)[0];
    expect(trickPose(target, state).moving).toBe(false);
    const end = 1000 + state.duration;
    expect(t.actorTime("ezra", end)).toBe(1000);
    expect(t.actorTime("ezra", end + 100)).toBe(1100);
    expect(t.snapshot(end)).toEqual([]);
    expect(trickPose(target, null)).toBe(target);
  },
);
test("frog and temporary capture have distinct short visible phases and always restore the same identity", () => {
  expect(trickPose(target, { kind: "spell", age: 1000, x: 2, z: 0 }).frog).toBe(
    true,
  );
  expect(trickPose(target, { kind: "spell", age: 2200, x: 2, z: 0 }).frog).toBe(
    false,
  );
  expect(
    trickPose(target, { kind: "pokeball", age: 1500, x: 2, z: 0 }).hidden,
  ).toBe(true);
  expect(
    trickPose(target, { kind: "pokeball", age: 2400, x: 2, z: 0 }).hidden,
  ).toBe(false);
});
test("distant, surfing, indoor and controlled actors cannot be captured; cancel preserves route continuity", () => {
  const t = createNpcTricks();
  const effect = { ...actor, kind: "spell" };
  expect(
    t.start(
      effect,
      [
        { ...target, x: 5 },
        { ...target, id: "fallyn", surfing: true },
        { ...target, id: "masyn" },
      ],
      "masyn",
      0,
    ).target,
  ).toBeUndefined();
  expect(t.start(effect, [target], "masyn", 0, false).target).toBeUndefined();
  t.start(effect, [target], "masyn", 1000);
  t.cancel(1600);
  expect(t.snapshot(1600)).toEqual([]);
  expect(t.actorTime("ezra", 1700)).toBe(1100);
});
test("the ocarina smoothly passes through night and returns to the original daylight", () => {
  const t = createNpcTricks();
  t.start({ ...actor, kind: "ocarina" }, [], "masyn", 1000);
  expect(t.night(1000)).toBe(0);
  expect(t.night(1000 + passingDuration / 2)).toBeCloseTo(1);
  expect(t.night(1000 + passingDuration)).toBe(0);
  expect(t.animating(1000 + passingDuration)).toBe(false);
});
