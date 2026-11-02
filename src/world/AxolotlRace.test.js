import { createAxolotlRace, raceCourse, raceLanes } from "./AxolotlRace";
import { personHeight } from "./Movement";
import { characters } from "./config";
import { isOcean } from "./TownLayout";
import { movementDirection, spriteFrame } from "./animation";
import sheets from "./SpriteSheets.json";

const origin = {
  x: 0,
  z: 30.8,
  direction: 4,
  outfit: "resume",
  surfing: false,
};
test("all five racers use everyday outfits and separate ocean lanes", () => {
  const race = createAxolotlRace(() => 0.5);
  expect(race.start(origin, 100)).toBe(true);
  expect(race.start(origin, 100)).toBe(false);
  expect(race.snapshot().countdown).toBe(3);
  for (const time of [3100, 9100, 15100, 22100]) {
    const state = race.update(time);
    expect(state.racers.map((r) => r.id)).toEqual(characters.map((p) => p.id));
    expect(new Set(state.racers.map((r) => r.z)).size).toBe(5);
    for (const r of state.racers) {
      expect(r.outfit).toBe(null);
      expect(r.surfing).toBe(true);
      expect(r.direction).toBe(movementDirection(1, 0));
      // Logical east is 2, even though the east-facing artwork lives in row 6.
      // Confusing these two indices made all swimmers race backwards.
      expect(
        spriteFrame(sheets[r.id + "-surf"], r.direction, true, 0).row,
      ).toBe(6);
      expect(isOcean(r.x, r.z)).toBe(true);
      expect(r.x).toBeGreaterThanOrEqual(raceCourse.startX);
      expect(r.x).toBeLessThanOrEqual(raceCourse.finishX);
      const lane = raceLanes.find((l) => l.id === r.id);
      expect(r.z - personHeight(r.id)).toBeGreaterThan(lane.near);
      expect(r.z + 0.4).toBeLessThan(lane.far);
    }
  }
});
test("the announced winner is actually the first swimmer over the finish", () => {
  for (const seed of [0, 0.2, 0.4, 0.6, 0.8]) {
    const race = createAxolotlRace(() => seed);
    race.start(origin, 0);
    const firstFinish = race.update(21000);
    const finished = firstFinish.racers.filter((r) => r.finished);
    expect(finished.map((r) => r.id)).toEqual([firstFinish.winner.id]);
    const result = race.update(27000);
    expect(result.done).toBe(true);
    expect(result.order[0]).toEqual(result.winner);
    expect(result.origin).toEqual(origin);
    expect(race.active()).toBe(false);
    expect(race.snapshot()).toBe(null);
  }
});
test("random finishing order can select every family member", () => {
  const winners = new Set();
  // A fixed stream makes this a reproducible distribution check, not a flaky
  // assertion against a live random generator or an implementation snapshot.
  let seed = 123456;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 100; i++) {
    const race = createAxolotlRace(random);
    race.start(origin, 0);
    winners.add(race.snapshot().winner.id);
  }
  expect(winners.size).toBe(5);
});
test("cancellation restores the borrowed appearance and can start another race", () => {
  const race = createAxolotlRace(() => 0.2);
  race.start(origin, 400);
  race.update(10000);
  expect(race.cancel()).toEqual(origin);
  expect(race.update(12000)).toBe(null);
  expect(race.cancel()).toBeUndefined();
  expect(race.start(origin, 15000)).toBe(true);
  expect(race.snapshot().countdown).toBe(3);
});
