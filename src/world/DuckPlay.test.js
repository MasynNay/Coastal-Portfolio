import { createDuckPlay } from "./DuckPlay";
import { duckRoutine } from "./Ducks";
import { roamingAnimals } from "./Roaming";
import { canStand } from "./navigation";
import { obstacles } from "./config";
import { isWater } from "./Surf";
import { shootsWebs } from "./Heroes";
import { characterSelection, characterAsset } from "./Wardrobe";
import sheets from "./SpriteSheets.json";
const origin = {
    x: 0,
    z: 3,
  },
  duck = {
    ...duckRoutine(0, 0),
    id: "abby",
  };
test("the ducks waddle onto grass and swim back with no blocked positions or sudden jumps", () => {
  const seen = new Map(["abby", "hulk", "bolt"].map((id) => [id, new Set()]));
  let previous = roamingAnimals(0).filter(
    (a) => a.kind === "duck" && !a.ambient,
  );
  for (let time = 0; time < 90000; time += 50) {
    const ducks = roamingAnimals(time).filter(
      (a) => a.kind === "duck" && !a.ambient,
    );
    for (const [i, a] of ducks.entries()) {
      seen.get(a.id).add(a.inWater);
      expect(isWater(a.x, a.z)).toBe(a.inWater);
      expect(canStand(a.x, a.z, obstacles, false, true)).toBe(true);
      expect(Math.hypot(a.x - previous[i].x, a.z - previous[i].z)).toBeLessThan(
        0.05,
      );
    }
    previous = ducks;
  }
  for (const modes of seen.values())
    expect([...modes].sort()).toEqual([false, true]);
});
test("peas and pets keep a walking player on land, finish once and reconnect the duck continuously", () => {
  for (const kind of ["feed", "pet"]) {
    const play = createDuckPlay(() => 0.4);
    expect(play.start("abby", kind, origin, duck)).toBe(true);
    let result = play.update(0.2, 200);
    expect(result.player).toEqual(origin);
    expect(result[kind === "feed" ? "peas" : "hearts"]).toBe(true);
    for (let time = 300; time <= 2300 && play.active(); time += 100)
      result = play.update(0.1, time);
    expect(result.done).toBe(true);
    expect(play.update(5, 6000)).toBe(null);
    let prior = result.duck;
    for (let time = result.time; time < result.time + 12000; time += 50) {
      const normal = {
          ...duck,
          ...duckRoutine(time, 0),
        },
        resumed = play.resume(normal, time);
      expect(Math.hypot(resumed.x - prior.x, resumed.z - prior.z)).toBeLessThan(
        0.3,
      );
      expect(canStand(resumed.x, resumed.z, obstacles, false, true)).toBe(true);
      prior = resumed;
    }
  }
});
test("a chase lasts exactly five seconds and never puts a walking player on water", () => {
  for (const [surfing, start] of [
    [false, origin],
    [
      true,
      {
        x: 0.25,
        z: -2,
      },
    ],
  ]) {
    const play = createDuckPlay(() => 0.4);
    expect(play.start("abby", "chase", start, duck, surfing)).toBe(true);
    let result,
      moved = false;
    for (let i = 1; i <= 49; i++) {
      result = play.update(0.1, i * 100);
      expect(result.done).toBe(false);
      moved ||=
        Math.hypot(result.player.x - start.x, result.player.z - start.z) > 0.1;
      expect(
        canStand(
          result.player.x,
          result.player.z,
          obstacles,
          false,
          result.surfing,
        ),
      ).toBe(true);
      // An unmounted visitor must never reach water; mounted visitors may
      // return to land during the chase.
      expect(!surfing && result.surfing).toBe(false);
      expect(!surfing && isWater(result.player.x, result.player.z)).toBe(false);
      expect(
        canStand(result.duck.x, result.duck.z, obstacles, false, true),
      ).toBe(true);
    }
    expect(moved).toBe(true);
    result = play.update(0.1, 5000);
    expect(result.done).toBe(true);
    expect(play.active()).toBe(false);
  }
});
test("canceling an activity cannot finish or reopen an old duck menu", () => {
  const play = createDuckPlay(() => 0.4);
  play.start("abby", "chase", origin, duck);
  play.update(1, 1000);
  play.cancel(1000);
  expect(play.active()).toBe(false);
  expect(play.snapshot()).toBe(null);
  expect(play.update(10, 11000)).toBe(null);
});
test("Fitzgerald has his own blue costume atlas and the same web cadence support as Ezra", () => {
  expect(characterSelection("outfit:spider-fitzgerald")).toEqual({
    character: "fitzgerald",
    outfit: "spider-fitzgerald",
  });
  expect(characterAsset("fitzgerald", "spider-fitzgerald")).toBe(
    "costume-fitzgerald-spider",
  );
  expect(sheets["costume-fitzgerald-spider"].rows).toBe(8);
  expect(shootsWebs("fitzgerald", "spider-fitzgerald")).toBe(true);
});

test("background mallards and teals stay spaced from the three interactive family ducks", () => {
  for (let time = 0; time < 90000; time += 250) {
    const flock = roamingAnimals(time).filter((a) => a.kind === "duck");
    expect(
      flock
        .filter((a) => !a.ambient)
        .map((a) => a.id)
        .sort(),
    ).toEqual(["abby", "bolt", "hulk"]);
    expect(flock.filter((a) => a.ambient)).toHaveLength(5);
    for (let i = 0; i < flock.length; i++)
      for (let j = i + 1; j < flock.length; j++)
        expect(
          Math.hypot(flock[i].x - flock[j].x, flock[i].z - flock[j].z),
        ).toBeGreaterThan(2);
  }
});

test("both geese share peas, pets and one safe chase, then reconnect without teleporting", () => {
  const pair = roamingAnimals(0).filter((a) => a.kind === "goose");
  for (const kind of ["feed", "pet", "chase"]) {
    const play = createDuckPlay(() => 0.4);
    expect(
      play.start("goose-pair", kind, { x: 0, z: 3 }, pair[0], false, [pair[1]]),
    ).toBe(true);
    let result;
    for (let t = 50; t <= 5000 && play.active(); t += 50) {
      result = play.update(0.05, t);
      expect(result.members).toHaveLength(2);
      const [a, b] = result.members.map((m) => m.duck);
      expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(0.59);
      for (const member of result.members)
        expect(
          canStand(member.duck.x, member.duck.z, obstacles, false, true),
        ).toBe(true);
      expect(
        canStand(
          result.player.x,
          result.player.z,
          obstacles,
          false,
          result.surfing,
        ),
      ).toBe(true);
      expect(result[kind === "feed" ? "peas" : "hearts"]).toBe(
        !result.done && kind !== "chase",
      );
    }
    expect(result.done).toBe(true);
    const previous = new Map(result.members.map((m) => [m.id, m.duck]));
    for (let t = result.time; t < result.time + 12000; t += 50) {
      for (const goose of roamingAnimals(t).filter((a) => a.kind === "goose")) {
        const resumed = play.resume(goose, t),
          prior = previous.get(goose.id);
        expect(
          Math.hypot(resumed.x - prior.x, resumed.z - prior.z),
        ).toBeLessThan(0.4);
        previous.set(goose.id, resumed);
      }
    }
    expect(play.update(1, 20000)).toBeNull();
  }
});
