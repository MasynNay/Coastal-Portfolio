import { startAbility, abilityColumn } from "./Abilities";
import { planTumbling, tumblingPose } from "./Tumbling";
import { spriteFrame } from "./animation";
import sheets from "./SpriteSheets.json";

test("Fallyn performs both handsprings and all drawn twist frames in either direction", () => {
  for (const direction of [2, 6]) {
    const effect = planTumbling(
      startAbility({ id: "fallyn", x: 0, z: 4, direction }, 0),
      () => true,
    );
    const seen = new Set();
    const sheet = sheets[effect.asset];
    for (let time = 0; time <= effect.duration; time += 5) {
      const pose = tumblingPose(effect, time);
      seen.add(abilityColumn(effect, time));
      expect(pose.z).toBe(4);
      expect(pose.lift).toBeGreaterThanOrEqual(0);
    }
    expect(seen.size).toBe(sheet.columns);
    expect(spriteFrame(sheet, effect.direction, true, 0).flip).toBe(
      direction === 6,
    );
    const end = tumblingPose(effect, effect.duration);
    expect(end.x).toBe(effect.distance);
    expect(end.lift).toBe(0);
  }
});

test("a tumbling pass selects a clear stretch or declines to cross a wall", () => {
  const effect = startAbility({ id: "fallyn", x: 0, z: 0, direction: 2 }, 0);
  expect(planTumbling(effect, ({ x }) => x >= 0).direction).toBe(6);
  expect(planTumbling(effect, ({ x }) => Math.abs(x) < 1)).toBeNull();
});
