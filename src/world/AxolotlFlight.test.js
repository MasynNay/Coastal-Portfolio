import { createAxolotlFlight, flightRules, flightSize } from "./AxolotlFlight";

function pilot(game, seconds, target = 220) {
  for (let i = 0; i < seconds * 120; i++) {
    const state = game.snapshot();
    if (state.phase === "over") break;
    if (state.y > target && state.velocity > 0) game.flap();
    game.update(1 / 120);
  }
  return game.snapshot();
}
test("the game waits for input and matches jump height at different frame rates", () => {
  const a = createAxolotlFlight(() => 0.5),
    b = createAxolotlFlight(() => 0.5);
  expect(a.update(0.1)).toEqual(a.snapshot());
  expect(a.snapshot().phase).toBe("ready");
  a.flap();
  b.flap();
  for (let i = 0; i < 12; i++) a.update(1 / 60);
  for (let i = 0; i < 6; i++) b.update(1 / 30);
  expect(a.snapshot().y).toBeCloseTo(180.2, 5);
  expect(a.snapshot().y).toBeCloseTo(b.snapshot().y, 5);
  expect(a.snapshot().velocity).toBeCloseTo(b.snapshot().velocity, 5);
});
test("passing an opening scores once and safely removes old eels", () => {
  const game = createAxolotlFlight(() => 0.5);
  game.flap();
  const state = pilot(game, 20);
  expect(state.phase).toBe("playing");
  expect(state.score).toBe(9);
  expect(state.eels.length).toBeLessThanOrEqual(5);
  const oldScore = state.score;
  game.update(1 / 120);
  expect(game.snapshot().score).toBe(oldScore);
  for (const eel of state.eels) {
    expect(eel.center - flightRules.gap / 2).toBeGreaterThan(0);
    expect(eel.center + flightRules.gap / 2).toBeLessThan(flightSize.floor);
  }
});
test("eel and floor collisions finish a run; another flap starts a clean round", () => {
  const game = createAxolotlFlight(() => 0);
  game.flap();
  const state = pilot(game, 8, 365);
  expect(state.phase).toBe("over");
  expect(state.score).toBe(0);
  expect(game.update(0.1)).toEqual(state);
  expect(game.flap()).toMatchObject({ phase: "playing", score: 0, y: 220 });
  for (let i = 0; i < 30; i++) game.update(0.1);
  expect(game.snapshot().phase).toBe("over");
});
