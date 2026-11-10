import {
  advanceGait,
  createFootfalls,
  gaitTimeForSheet,
  walkCycleMs,
  runCycleMs,
} from "./Gait";
import { walkSpeed, runSpeed } from "./Movement";
import appearances from "./Appearances.json";
import timing from "./Gait.json";
import sheets from "./SpriteSheets.json";
import { spriteFrame } from "./animation";

test("each outfit lands its own last step without moving the player or holding an action", () => {
  const sample = createFootfalls();
  for (const { asset } of appearances) {
    const stride = {
      id: asset,
      x: 4,
      z: 5,
      art: asset + "-run",
      moving: true,
      time: 300,
      direction: 2,
    };
    const standing = { ...stride, art: asset, moving: false, time: 0 };
    expect(sample(stride, sheets[stride.art], 100)).toBe(stride);
    expect(sample(standing, sheets[asset], 110)).toMatchObject({
      x: 4,
      z: 5,
      art: stride.art,
      time: 300,
    });
    expect(sample(standing, sheets[asset], 170).time).toBeGreaterThan(300);
    expect(sample(standing, sheets[asset], 226)).toBe(standing);
    sample(stride, sheets[stride.art], 250);
    const fishing = { ...standing, art: asset + "-fish" };
    expect(sample(fishing, sheets[fishing.art], 260)).toBe(fishing);
    expect(sample(standing, sheets[asset], 270)).toBe(standing);
  }
});

test("a running stride takes its intended real time instead of being accelerated twice", () => {
  const runClock = advanceGait((runSpeed * runCycleMs) / 1000, true);
  const walkClock = advanceGait((walkSpeed * walkCycleMs) / 1000);
  expect(runClock).toBeCloseTo(walkCycleMs);
  expect(walkClock).toBeCloseTo(walkCycleMs);
  expect(runCycleMs).toBeLessThan(walkCycleMs);
  // Keep a purposeful jog rather than the previous ~583 ms leg cycle.
  expect(runCycleMs).toBeGreaterThanOrEqual(850);
  expect(advanceGait(0, true)).toBe(0);
});

test("every outfit keeps the same leading foot when switching between walk/run or a loading fallback", () => {
  for (const { asset } of appearances) {
    const walk = sheets[asset],
      run = sheets[asset + "-run"];
    expect(walk.frameMs * walk.cycleFrames).toBe(timing.walkCycleMs);
    expect(run.frameMs * run.cycleFrames).toBe(timing.runCycleMs);
    expect(walk.cycleFrames).toBe(32);
    expect(run.cycleFrames).toBe(walk.cycleFrames);
    for (let phase = 0; phase < walk.cycleFrames; phase++) {
      const clock = ((phase + 0.25) / walk.cycleFrames) * walkCycleMs;
      for (let direction = 0; direction < 8; direction++) {
        const a = spriteFrame(
          walk,
          direction,
          true,
          gaitTimeForSheet(walk, clock),
        );
        const b = spriteFrame(
          run,
          direction,
          true,
          gaitTimeForSheet(run, clock),
        );
        expect(a).toEqual(b);
        expect(a.column).toBe(phase);
      }
    }
  }
});

test("locomotion timing does not change casting, mount, vehicle or ability animations", () => {
  for (const action of [
    "fish",
    "surf",
    "bike",
    "board-trick",
    "ability",
    "ride",
  ])
    expect(gaitTimeForSheet({ action, columns: 8, frameMs: 95 }, 736)).toBe(
      736,
    );
});

test("adding actual poses changes sampling detail without changing stride duration", () => {
  for (const action of ["walk", "run"]) {
    const cycle = timing[action + "CycleMs"];
    for (const count of [8, 16, 32]) {
      const sheet = {
        action,
        cycleFrames: count,
        columns: count + 1,
        frameMs: cycle / count,
        rows: 8,
        layout: "eight",
      };
      const time = gaitTimeForSheet(sheet, walkCycleMs * 0.75);
      expect(spriteFrame(sheet, 0, true, time).column).toBe(count * 0.75);
      const distance =
        ((action === "run" ? runSpeed : walkSpeed) * cycle) / 1000;
      expect(
        gaitTimeForSheet(sheet, advanceGait(distance, action === "run")),
      ).toBeCloseTo(cycle);
    }
  }
});
