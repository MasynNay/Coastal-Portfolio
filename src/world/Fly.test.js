import { flightFrame, flyDepartureMs, flyArrivalMs } from "./Fly";
test("Fly turns the character, picks up, fades, then drops off before the bird leaves", () => {
  expect(flightFrame("out", 0)).toMatchObject({
    phase: "turn",
    player: true,
    bird: false,
    fade: 0,
  });
  expect(flightFrame("out", flyDepartureMs * 0.4)).toMatchObject({
    phase: "pickup",
    bird: true,
  });
  expect(flightFrame("out", flyDepartureMs)).toMatchObject({
    phase: "takeoff",
    player: false,
    fade: 1,
  });
  expect(flightFrame("in", 0)).toMatchObject({
    phase: "landing",
    player: false,
    fade: 1,
  });
  expect(flightFrame("in", flyArrivalMs * 0.8)).toMatchObject({
    phase: "release",
    player: true,
  });
  expect(flightFrame("in", flyArrivalMs).fade).toBe(0);
});
test("the first queued animation frame never produces a negative sprite direction", () => {
  expect(flightFrame("out", -2).direction).toBe(0);
});
test("every selected costume is retained through duck pickup, flight and landing", () => {
  const { flightAppearance } = require("./Fly");
  for (const [id, outfit, asset] of [
    ["masyn", "resume", "costume-resume"],
    ["masyn", "skills", "costume-skills"],
    ["masyn", "lodge", "link"],
    ["masyn", "home", "costume-airbender"],
    ["ezra", "spider-ezra", "costume-ezra-spider"],
    ["fitzgerald", "spider-fitzgerald", "costume-fitzgerald-spider"],
  ]) {
    const a = flightAppearance(id, outfit);
    expect(a.layered).toBe(true);
    expect([a.body, a.call, a.rider, a.land]).toEqual([
      asset,
      asset,
      asset,
      asset,
    ]);
  }
  expect(flightAppearance("masyn", null).rider).toBe("masyn");
});
