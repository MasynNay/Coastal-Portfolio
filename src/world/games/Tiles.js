// Pure 2048 rules: compact toward the requested edge and merge each tile once.
export function slideTiles(board, direction) {
  const next = [...board];
  let score = 0;
  for (let lane = 0; lane < 4; lane++) {
    const indices = Array.from({ length: 4 }, (_, i) =>
      direction === "left"
        ? lane * 4 + i
        : direction === "right"
          ? lane * 4 + 3 - i
          : direction === "up"
            ? i * 4 + lane
            : (3 - i) * 4 + lane,
    );
    const values = indices.map((i) => board[i]).filter(Boolean),
      merged = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        const value = values[i] * 2;
        merged.push(value);
        score += value;
        i++;
      } else merged.push(values[i]);
    }
    indices.forEach((index, i) => (next[index] = merged[i] || 0));
  }
  return { board: next, score, changed: next.some((v, i) => v !== board[i]) };
}
export function spawnTile(board, random = Math.random) {
  const empty = board.flatMap((v, i) => (v ? [] : [i]));
  if (!empty.length) return board;
  const next = [...board];
  next[empty[Math.min(empty.length - 1, Math.floor(random() * empty.length))]] =
    random() < 0.9 ? 2 : 4;
  return next;
}
export const newTiles = (random = Math.random) =>
  spawnTile(spawnTile(Array(16).fill(0), random), random);
export const tilesEnded = (board) =>
  !["left", "right", "up", "down"].some((d) => slideTiles(board, d).changed);
