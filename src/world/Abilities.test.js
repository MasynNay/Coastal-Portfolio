import {
  characterAbility,
  startAbility,
  abilityActive,
  abilityLocksMovement,
  abilityColumn,
  abilityProjectile,
} from "./Abilities";
import { playerPose } from "./PlayerPose";
import { spriteFrame } from "./animation";
import sheets from "./SpriteSheets.json";
test("each Masyn costume has its own complete Q sequence and restores its walking pose afterward", () => {
  for (const outfit of ["lodge", "contact", "resume", "portfolio", "skills"]) {
    const effect = startAbility(
      { id: "masyn", outfit, x: 2, z: 3, direction: 6 },
      100,
    );
    expect(effect.asset).toBeTruthy();
    const seen = new Set();
    for (let time = 100; time < 100 + effect.duration; time += 25) {
      const pose = playerPose({
        character: "masyn",
        outfit,
        abilityEffect: effect,
        worldTime: time,
      });
      expect(pose).toBe(effect.asset);
      const column = abilityColumn(effect, time);
      seen.add(column);
      const frame = spriteFrame(
        sheets[pose],
        6,
        true,
        column * sheets[pose].frameMs,
      );
      expect(frame.column).toBe(column);
      expect(frame.row).toBe(sheets[pose].mirrorWest ? 3 : 2);
      expect(frame.flip).toBe(!!sheets[pose].mirrorWest);
      expect(abilityLocksMovement(effect, time)).toBe(true);
    }
    expect([...seen]).toEqual(
      Array.from({ length: sheets[effect.asset].columns }, (_, i) => i),
    );
    const time = 100 + effect.duration;
    expect(abilityActive(effect, time)).toBe(false);
    expect(abilityLocksMovement(effect, time)).toBe(false);
    expect(
      playerPose({
        character: "masyn",
        outfit,
        abilityEffect: effect,
        worldTime: time,
      }),
    ).not.toBe(effect.asset);
    expect(abilityProjectile(effect, time)).toBe(null);
  }
});
test("every outfit action has real front, back and side rows for all four facings", () => {
  for (const outfit of ["lodge", "contact", "resume", "portfolio", "skills"]) {
    const sheet = sheets[characterAbility("masyn", outfit).asset];
    expect(sheet.rows).toBe(4);
    expect(sheet.layout).toBe("four");
    expect(spriteFrame(sheet, 0, true, 200).row).toBe(0);
    expect(spriteFrame(sheet, 4, true, 200).row).toBe(1);
    expect(spriteFrame(sheet, 2, true, 200).row).toBe(3);
    const west = spriteFrame(sheet, 6, true, 200);
    expect(west.row).toBe(sheet.mirrorWest ? 3 : 2);
    expect(west.flip).toBe(!!sheet.mirrorWest);
  }
});
test("trident returns to the throwing hand before the held trident reappears", () => {
  const e = startAbility(
    { id: "masyn", outfit: "contact", x: 0, z: 0, direction: 2 },
    0,
  );
  expect(abilityProjectile(e, 279)).toBe(null);
  expect(abilityProjectile(e, 280).x).toBeCloseTo(0.55);
  expect(abilityProjectile(e, 715).x).toBeGreaterThan(4);
  expect(abilityProjectile(e, 1149).x).toBeCloseTo(0.55, 1);
  expect(abilityProjectile(e, 1150)).toBe(null);
  expect(abilityColumn(e, 1150)).toBe((3 * sheets[e.asset].columns) / 4);
});
test("archer aim rows follow the same cardinal direction as the released arrow", () => {
  for (const [direction, row, dx, dz] of [
    [0, 0, 0, 1],
    [4, 1, 0, -1],
    [6, 2, -1, 0],
    [2, 3, 1, 0],
  ]) {
    const effect = startAbility(
      { id: "masyn", outfit: "skills", x: 3, z: 5, direction },
      0,
    );
    const frame = spriteFrame(
      sheets[effect.asset],
      effect.direction,
      true,
      abilityColumn(effect, 600) * sheets[effect.asset].frameMs,
    );
    expect(frame.row).toBe(row);
    const arrow = abilityProjectile(effect, 600);
    expect(arrow.x - 3).toBeCloseTo(dx * Math.hypot(arrow.x - 3, arrow.z - 5));
    expect(arrow.z - 5).toBeCloseTo(dz * Math.hypot(arrow.x - 3, arrow.z - 5));
  }
});
test("children retain their Q actions; mounted Masyn keeps his axolotl instead of replacing it", () => {
  expect(characterAbility("ezra").kind).toBe("web");
  expect(characterAbility("fitzgerald").kind).toBe("web");
  expect(characterAbility("fallyn").kind).toBe("tumbling");
  expect(characterAbility("fallyn", "ladybug-fallyn").kind).toBe("yoyo");
  expect(characterAbility("fallyn", null, true)).toBeNull();
  expect(characterAbility("masyn", "everyday")).toBe(null);
  expect(characterAbility("masyn", "home").kind).toBe("glide");
  expect(characterAbility("masyn", "lodge", true)).toBe(null);
  expect(
    startAbility({ id: "masyn", outfit: "contact", surfing: true }, 0),
  ).toBe(null);
});
test("Mi Shell has a four-direction money toss and keeps her surf mount", () => {
  const a = characterAbility("mi-shell");
  expect(a.kind).toBe("money");
  expect(a.asset).toBe("ability-money");
  expect(characterAbility("mi-shell", null, true)).toBe(null);
  const effect = startAbility(
    { id: "mi-shell", x: 2, z: 3, direction: 4 },
    100,
  );
  expect(effect.dz).toBeCloseTo(-1);
  expect(abilityColumn(effect, 700)).toBe(
    (2 * sheets[effect.asset].columns) / 4,
  );
});
