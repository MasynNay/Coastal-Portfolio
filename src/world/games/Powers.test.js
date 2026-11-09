import {
  newGems,
  swapGems,
  activateGem,
  gemMatches,
  isBomb,
  RAINBOW,
  ballColor,
} from "./Gems";
import { coinDrawTime, fireClearTime, newRunner, stepRunner } from "./Runner";
function rng() {
  let seed = 401;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test.each([4, 5])(
  "matching %i in a row earns the correct persistent power",
  (length) => {
    const random = rng(),
      board = newGems(random);
    board.splice(0, 6, 0, 0, 0, 1, length === 5 ? 0 : 2, 3);
    board[11] = 0;
    const result = swapGems(board, 3, 11, random);
    expect(result).not.toBeNull();
    expect(result.created).toContain(length === 5 ? "rainbow" : "bomb");
    expect(
      result.board.some(length === 5 ? (n) => n === RAINBOW : isBomb),
    ).toBe(true);
    expect(gemMatches(result.board).size).toBe(0);
  },
);
test("a rainbow clears the chosen color anywhere on the board; adjacent bombs chain", () => {
  const random = rng(),
    board = newGems(random);
  board[0] = RAINBOW;
  board[63] = 3;
  const wanted = board.filter((n) => ballColor(n) === 3).length;
  const result = activateGem(board, 0, 63, random);
  expect(result.effects[0].kind).toBe("rainbow");
  expect(result.effects[0].cells).toContain(63);
  expect(result.cleared).toBeGreaterThanOrEqual(wanted + 1);
  const bombs = newGems(random);
  bombs[0] = 6;
  bombs[9] = 7;
  const chain = activateGem(bombs, 0, null, random);
  expect(
    chain.effects.filter((e) => e.kind === "bomb").length,
  ).toBeGreaterThanOrEqual(2);
  expect(chain.cleared).toBeGreaterThanOrEqual(9);
});
function pickup(kind) {
  const state = newRunner();
  state.objects = [{ at: 0.1, lane: 1, kind }];
  stepRunner(state, 0.02);
  return state;
}
test("runner elemental powers shield hits, draw distant sparks, clear obstacles and double points", () => {
  const shield = pickup("air");
  shield.objects = [{ at: shield.distance + 0.1, lane: 1, kind: "crate" }];
  stepRunner(shield, 0.02);
  expect(shield.hearts).toBe(3);
  expect(shield.shield).toBe(0);
  const magnet = pickup("water");
  magnet.objects = [{ at: magnet.distance + 10, lane: 0, kind: "coin" }];
  stepRunner(magnet, 0.02);
  expect(magnet.coins).toBe(0);
  expect(magnet.objects[0].drawnAt).toBeDefined();
  for (let t = 0; t < coinDrawTime; t += 0.01) stepRunner(magnet, 0.01);
  expect(magnet.coins).toBe(1);
  expect(magnet.objects.some((item) => item.drawnAt != null)).toBe(false);
  const fire = newRunner();
  fire.objects = [
    { at: 0.1, lane: 1, kind: "fire" },
    { at: 5, lane: 1, kind: "crate" },
    { at: 5, lane: 0, kind: "coin" },
  ];
  stepRunner(fire, 0.02);
  expect(fire.objects.find((o) => o.kind === "crate").burningAt).toBeDefined();
  for (let t = 0; t <= fireClearTime + 0.02; t += 0.01) stepRunner(fire, 0.01);
  expect(fire.hearts).toBe(3);
  expect(fire.objects.some((o) => o.kind === "crate" && o.at === 5)).toBe(
    false,
  );
  expect(fire.objects.some((o) => o.kind === "coin" && o.at === 5)).toBe(true);
  const earth = pickup("earth");
  earth.objects = [{ at: earth.distance + 0.1, lane: 1, kind: "coin" }];
  stepRunner(earth, 0.02);
  expect(earth.coinScore).toBe(20);
});
