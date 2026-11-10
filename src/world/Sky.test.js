import { skyBirds, createSkySalute, flyoverPeriod } from "./Sky";
import looks from "./Appearances.json";
import sheets from "./SpriteSheets.json";
import { playerPose } from "./PlayerPose";

test("every tenth outdoor flyover is exactly three mockingjays, in both travel directions", () => {
  for (let cycle = 0; cycle < 30; cycle++) {
    const flock = skyBirds(cycle * flyoverPeriod + 9000, { x: 0, z: 0 });
    const special = (cycle + 1) % 10 === 0;
    expect(flock).toHaveLength(special ? 3 : 3 + (cycle % 2));
    expect(flock.some((b) => b.art === "mockingjay-flight")).toBe(special);
    expect(skyBirds(cycle * flyoverPeriod, { x: 0, z: 0 })).toHaveLength(0);
  }
});
test("the salute holds for three seconds, cannot repeat within one flock and returns next tenth flight", () => {
  const salute = createSkySalute(),
    start = 9 * flyoverPeriod + 8500;
  expect(salute.update(start - 1)).toBeNull();
  expect(salute.update(start)).toEqual({ elapsed: 0, frame: 0 });
  expect(salute.update(start + 2999).frame).toBe(7);
  expect(salute.update(start + 3000)).toBeNull();
  expect(salute.update(start + 3100)).toBeNull();
  expect(salute.update(19 * flyoverPeriod + 8500)).not.toBeNull();
  salute.cancel();
  expect(salute.active()).toBe(false);
  expect(salute.update(19 * flyoverPeriod + 8600)).toBeNull();
});
test("every family appearance has a sixteen-pose salute and retains its costume", () => {
  for (const look of looks) {
    const state = {
      character: look.character,
      outfit: look.id,
      salute: { frame: 4, elapsed: 1600 },
    };
    expect(playerPose(state)).toBe(look.asset + "-salute");
    const sheet = sheets[look.asset + "-salute"];
    expect(sheet.columns).toBe(16);
    expect(sheet.columns * sheet.frameMs).toBe(3000);
    // Water/bike sheets retain their mount for upper-body compositing.
    expect(playerPose({ ...state, surfing: true })).toBe(look.asset + "-surf");
  }
});

test("a manual Panem salute uses the activity clock even when the indoor sky is stopped", () => {
  const salute = createSkySalute();
  expect(salute.start(1000)).toBe(true);
  expect(salute.start(1100)).toBe(false);
  expect(salute.update(0, false, 2500).frame).toBe(4);
  expect(salute.update(0, false, 4000)).toBeNull();
});
