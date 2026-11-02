// Balls 0–5 are normal colors; 6–11 are color-matched Rocket bombs, and 12 is
// a rainbow ball. Keeping each tile in one value lets gravity move its power
// with it instead of leaving a separate power map behind after a cascade.
export const RAINBOW = 12;
export const isBomb = (n) => n >= 6 && n < 12;
export const ballColor = (n) => (n == null || n === RAINBOW ? null : n % 6);
export const adjacent = (a, b) =>
  Math.abs(Math.floor(a / 8) - Math.floor(b / 8)) +
    Math.abs((a % 8) - (b % 8)) ===
  1;
export function matchRuns(board) {
  const runs = [];
  for (const step of [1, 8])
    for (let line = 0; line < 8; line++) {
      let start = 0;
      while (start < 8) {
        const at = (n) => (step === 1 ? line * 8 + n : n * 8 + line);
        const color = ballColor(board[at(start)]);
        let end = start + 1;
        while (end < 8 && color !== null && ballColor(board[at(end)]) === color)
          end++;
        const begin = start;
        if (color !== null && end - start >= 3)
          runs.push(
            Array.from({ length: end - start }, (_, i) => at(begin + i)),
          );
        start = end;
      }
    }
  return runs;
}
export const gemMatches = (board) => new Set(matchRuns(board).flat());
export function gemMoves(board) {
  if (board.some((n) => isBomb(n) || n === RAINBOW)) return true;
  for (let i = 0; i < 64; i++)
    for (const j of [i + 1, i + 8])
      if (j < 64 && adjacent(i, j)) {
        const trial = [...board];
        [trial[i], trial[j]] = [trial[j], trial[i]];
        if (gemMatches(trial).size) return true;
      }
  return false;
}
export function newGems(random = Math.random) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const board = [];
    for (let i = 0; i < 64; i++) {
      let value = Math.min(5, Math.floor(random() * 6));
      for (let tries = 0; tries < 6; tries++) {
        if (
          !(i % 8 > 1 && board[i - 1] === value && board[i - 2] === value) &&
          !(i > 15 && board[i - 8] === value && board[i - 16] === value)
        )
          break;
        value = (value + 1) % 6;
      }
      board.push(value);
    }
    if (gemMoves(board)) return board;
  }
  return Array.from(
    { length: 64 },
    (_, i) => (Math.floor(i / 8) * 2 + (i % 8)) % 6,
  ).map((v, i) => (i === 0 ? 1 : i === 1 ? 0 : i === 8 ? 0 : i === 16 ? 1 : v));
}
function blast(index) {
  const cells = [];
  const x = index % 8,
    y = Math.floor(index / 8);
  for (let row = Math.max(0, y - 1); row <= Math.min(7, y + 1); row++)
    for (let col = Math.max(0, x - 1); col <= Math.min(7, x + 1); col++)
      cells.push(row * 8 + col);
  return cells;
}
// Resolve an entire turn once. Special balls survive their creating match;
// old bombs chain, gravity preserves powers, and a capped loop guards custom RNGs.
function resolve(board, random, first = null, preferred = []) {
  let next = [...board],
    score = 0,
    cleared = 0,
    cascades = 0;
  const effects = [],
    created = [],
    steps = [];
  for (; cascades < 20; cascades++) {
    const runs = first && cascades === 0 ? [] : matchRuns(next),
      matches = first && cascades === 0 ? new Set(first) : new Set(runs.flat());
    if (!matches.size) break;
    const effectStart = effects.length;
    const made = new Map();
    for (const run of runs
      .filter((r) => r.length >= 4)
      .sort((a, b) => b.length - a.length)) {
      const at =
        preferred.find((i) => run.includes(i) && !made.has(i)) ??
        run.find((i) => !made.has(i));
      if (at == null) continue;
      const value = run.length >= 5 ? RAINBOW : 6 + ballColor(next[at]);
      made.set(at, value);
      created.push(value === RAINBOW ? "rainbow" : "bomb");
    }
    const activated = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      for (const i of [...matches])
        if (isBomb(next[i]) && !activated.has(i)) {
          activated.add(i);
          const cells = blast(i);
          for (const cell of cells)
            if (!matches.has(cell)) {
              matches.add(cell);
              changed = true;
            }
          effects.push({ kind: "bomb", index: i, cells });
        }
    }
    // A pre-existing bomb explosion can destroy a newly earned power at that
    // location; otherwise the creating tile remains for a later player move.
    for (const [at, value] of made) {
      if (activated.has(at)) continue;
      next[at] = value;
      matches.delete(at);
    }
    effects.push({ kind: "match", cells: [...matches] });
    const before = [...next],
      falls = Array(64).fill(0);
    cleared += matches.size;
    score += matches.size * 10 * (cascades + 1);
    for (let col = 0; col < 8; col++) {
      const kept = Array.from({ length: 8 }, (_, row) => row * 8 + col)
        .filter((i) => !matches.has(i))
        .map((i) => ({ value: next[i], row: Math.floor(i / 8) }));
      const missing = 8 - kept.length;
      for (let n = 1; n <= missing; n++)
        kept.unshift({ value: Math.min(5, Math.floor(random() * 6)), row: -n });
      for (let row = 0; row < 8; row++) {
        next[row * 8 + col] = kept[row].value;
        falls[row * 8 + col] = row - kept[row].row;
      }
    }
    steps.push({
      before,
      board: [...next],
      cleared: [...matches],
      falls,
      effects: effects.slice(effectStart),
      created: [...made.keys()],
      combo: cascades + 1,
    });
  }
  const shuffled = !!gemMatches(next).size || !gemMoves(next);
  return {
    board: shuffled ? newGems(random) : next,
    score,
    cleared,
    cascades,
    shuffled,
    created,
    effects,
    steps,
  };
}
export function activateGem(board, index, target = null, random = Math.random) {
  if (isBomb(board[index])) return resolve(board, random, new Set([index]));
  if (board[index] !== RAINBOW || target == null || index === target)
    return null;
  const color = ballColor(board[target]);
  if (color == null && board[target] !== RAINBOW) return null;
  const cells = board
    .map((n, i) =>
      i === index || board[target] === RAINBOW || ballColor(n) === color
        ? i
        : null,
    )
    .filter((i) => i !== null);
  const result = resolve(board, random, cells);
  result.effects.unshift({ kind: "rainbow", index, cells });
  result.steps[0]?.effects.unshift({ kind: "rainbow", index, cells });
  return result;
}
export function swapGems(board, a, b, random = Math.random) {
  if (a === b) return null;
  if (board[a] === RAINBOW) return activateGem(board, a, b, random);
  if (board[b] === RAINBOW) return activateGem(board, b, a, random);
  if (!adjacent(a, b)) return null;
  const next = [...board];
  [next[a], next[b]] = [next[b], next[a]];
  if (isBomb(next[a])) return activateGem(next, a, null, random);
  if (isBomb(next[b])) return activateGem(next, b, null, random);
  if (!gemMatches(next).size) return null;
  return {
    ...resolve(next, random, null, [b, a]),
    swap: { a, b, before: board },
  };
}
