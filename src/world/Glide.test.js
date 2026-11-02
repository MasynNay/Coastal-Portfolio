import { planGlide, glideVisual, glideDurationMs } from "./Glide";
import { startAbility } from "./Abilities";
import { canStand } from "./navigation";
import { obstacles, roomObstacles } from "./config";
import { roomEntrance } from "./WorldLayout";
import { playerPose } from "./PlayerPose";
import { spriteFrame } from "./animation";
import sheets from "./SpriteSheets.json";

const actor = { id: "masyn", outfit: "home", x: 0, z: 9, direction: 0 };
test("airbending takes off, travels a full circle, lands on its start and uses directional art", () => {
  const effect = planGlide(startAbility(actor, 0), (p) =>
    canStand(p.x, p.z, obstacles),
  );
  expect(effect.radius).toBe(1.6);
  const positions = new Set(),
    directions = new Set(),
    phases = new Set();
  let farthest = 0;
  for (let time = 0; time < glideDurationMs; time += 20) {
    const f = glideVisual(effect, time);
    expect(canStand(f.x, f.z, obstacles)).toBe(true);
    phases.add(f.phase);
    positions.add(f.x.toFixed(2) + ":" + f.z.toFixed(2));
    farthest = Math.max(farthest, Math.hypot(f.x - actor.x, f.z - actor.z));
    const pose = playerPose({
      character: "masyn",
      outfit: "home",
      abilityEffect: effect,
      worldTime: time,
    });
    expect(pose).toBe(f.asset);
    const frame = spriteFrame(
      sheets[pose],
      f.direction,
      true,
      f.frame * sheets[pose].frameMs,
    );
    expect(frame.column).toBe(f.frame);
    if (f.phase === "gliding") directions.add(frame.row);
  }
  expect(phases).toEqual(new Set(["takeoff", "gliding", "landing"]));
  expect(directions.size).toBe(8);
  expect(positions.size).toBeGreaterThan(80);
  expect(farthest).toBeGreaterThan(3);
  expect(glideVisual(effect, 3250)).toMatchObject({
    x: actor.x,
    z: actor.z,
    phase: "landing",
  });
  expect(glideVisual(effect, 3899).lift).toBe(0);
  expect(glideVisual(effect, 3900)).toBe(null);
});
test("a planned circle stays within the room and cannot cross the perimeter fence", () => {
  for (const [position, inside, direction] of [
    [{ x: 27, z: 7 }, false, 2],
    [{ x: -27, z: 7 }, false, 6],
    [roomEntrance, true, 0],
  ]) {
    const check = (p) =>
      canStand(p.x, p.z, inside ? roomObstacles : obstacles, inside);
    const effect = planGlide(
      startAbility({ ...actor, ...position, direction }, 100),
      check,
    );
    expect(effect).not.toBe(null);
    for (let time = 100; time < 4000; time += 10) {
      const p = glideVisual(effect, time);
      expect(check(p)).toBe(true);
    }
  }
  expect(planGlide(startAbility(actor, 0), () => false)).toBe(null);
});
