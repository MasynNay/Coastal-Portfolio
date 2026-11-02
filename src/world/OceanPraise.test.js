import { createOceanPraise } from "./OceanPraise";
import { createResidentPause } from "./ResidentPause";
test("only an Ocean King throw at the pier edge summons the school, with one collective message", () => {
  const effect = createOceanPraise();
  for (const actor of [
    { x: 0, z: 10, kind: "trident" },
    { x: 0, z: 27, kind: "trident" },
    { x: 2, z: 27, kind: "spell" },
    { x: 2, z: 27, kind: "trident", surfing: true },
    { x: 2, z: 27, kind: "trident", room: "contact" },
  ])
    expect(effect.summon(actor, 0)).toBe(false);
  expect(effect.summon({ x: 2, z: 27, kind: "trident" }, 100)).toBe(true);
  expect(effect.snapshot(300)).toBeNull();
  expect(effect.snapshot(1600)).toMatchObject({ x: 9, z: 28, speaking: true });
  expect(effect.snapshot(6000)).toBeNull();
  effect.cancel();
  expect(effect.snapshot(2000)).toBeNull();
});
test("a borrowed wakeboarder resumes at exactly the same point in their routine", () => {
  const pause = createResidentPause();
  pause.hold("ezra", 1000);
  expect(pause.timeFor("ezra", 5000)).toBe(1000);
  expect(pause.timeFor("fallyn", 5000)).toBe(5000);
  pause.release(8000);
  expect(pause.timeFor("ezra", 8000)).toBe(1000);
  expect(pause.timeFor("ezra", 9000)).toBe(2000);
  pause.hold("ezra", 10000);
  pause.release(12000);
  expect(pause.timeFor("ezra", 12000)).toBe(3000);
});
