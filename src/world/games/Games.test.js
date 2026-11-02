import { slideTiles, spawnTile, tilesEnded } from "./Tiles";
import { newGems, gemMatches, gemMoves, swapGems, adjacent } from "./Gems";
import { memoryDeck } from "./MemoryGame";
import { newRunner, runnerAction, stepRunner } from "./Runner";

test("Element Runner changes lanes without leaving the track, and jumping/sliding avoid the right obstacles", () => {
  for (const [kind, action] of [
    ["crate", "jump"],
    ["rail", "jump"],
    ["arch", "duck"],
  ]) {
    const game = newRunner();
    game.objects = [{ at: 3, lane: 1, kind }];
    runnerAction(game, action);
    for (let i = 0; i < 26; i++) stepRunner(game, 0.01);
    expect(game.over).toBe(false);
    const hit = newRunner();
    hit.objects = [{ at: 0.1, lane: 1, kind }];
    stepRunner(hit, 0.02);
    expect(hit.over).toBe(false);
    expect(hit.hearts).toBe(2);
  }
  const game = newRunner();
  for (let i = 0; i < 10; i++) runnerAction(game, "left");
  expect(game.lane).toBe(0);
  for (let i = 0; i < 10; i++) runnerAction(game, "right");
  expect(game.lane).toBe(2);
});
test("runner sparks score once, obstacle storage is bounded and each row has a safe lane", () => {
  const game = newRunner();
  game.objects = [{ at: 0.1, lane: 1, kind: "coin" }];
  stepRunner(game, 0.02);
  stepRunner(game, 0.02);
  expect(game.coins).toBe(1);
  for (let i = 0; i < 10000; i++) {
    game.over = false;
    stepRunner(game, 0.016, () => 0.5);
    expect(game.objects.length).toBeLessThan(40);
  }
  expect(
    game.objects
      .filter((o) => ["crate", "rail", "arch"].includes(o.kind))
      .every((o) => o.lane === 1),
  ).toBe(true);
});

test("2048 merges each tile once, scores accurately, and respects all directions", () => {
  let board = Array(16).fill(0);
  board.splice(0, 4, 2, 2, 2, 2);
  expect(slideTiles(board, "left")).toEqual({
    board: [4, 4, 0, 0, ...Array(12).fill(0)],
    score: 8,
    changed: true,
  });
  expect(slideTiles(board, "right").board.slice(0, 4)).toEqual([0, 0, 4, 4]);
  board = Array(16).fill(0);
  [0, 4, 8, 12].forEach((i) => (board[i] = 2));
  expect(slideTiles(board, "up").board.filter(Boolean)).toEqual([4, 4]);
  expect(slideTiles(board, "down").board[12]).toBe(4);
  expect(spawnTile(Array(16).fill(0), () => 0.5).filter(Boolean)).toEqual([2]);
  expect(tilesEnded(Array.from({ length: 16 }, (_, i) => 2 ** (i + 1)))).toBe(
    true,
  );
});
test("solar boards start without free matches, contain legal moves and reject non-matching/non-neighbor swaps", () => {
  let seed = 19;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let n = 0; n < 20; n++) {
    const board = newGems(random);
    expect(gemMatches(board).size).toBe(0);
    expect(gemMoves(board)).toBe(true);
    expect(swapGems(board, 0, 63, random)).toBeNull();
    let result;
    for (let i = 0; i < 64 && !result; i++)
      for (const j of [i + 1, i + 8])
        if (j < 64 && adjacent(i, j)) {
          result = swapGems(board, i, j, random);
          if (result) break;
        }
    expect(result.score).toBeGreaterThan(0);
    expect(result.cleared).toBeGreaterThanOrEqual(3);
    expect(gemMatches(result.board).size).toBe(0);
    expect(gemMoves(result.board)).toBe(true);
  }
});
test("wizard memory contains exactly two independently keyed cards for each of six pairs", () => {
  const deck = memoryDeck(() => 0.5);
  expect(deck).toHaveLength(12);
  expect(new Set(deck.map((c) => c.id)).size).toBe(12);
  for (let i = 0; i < 6; i++)
    expect(deck.filter((c) => c.pair === i)).toHaveLength(2);
});
