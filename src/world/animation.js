// Visually audited against the actual source art, not the old (incorrect) row labels.
// Entry order is screen down, down-right, right, up-right, up, up-left, left, down-left.
const NORMAL = [
  [0, 0],
  [7, 0],
  [6, 0],
  [5, 0],
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 0],
];
const FAMILY = [
  [0, 0],
  [1, 1],
  [2, 1],
  [3, 0],
  [4, 0],
  [3, 1],
  [2, 0],
  [1, 0],
];
const COSTUME = [
  [0, 0],
  [1, 1],
  [2, 1],
  [5, 0],
  [4, 0],
  [5, 1],
  [2, 0],
  [1, 0],
];
const TRAINER = [
  [0, 0],
  [1, 1],
  [2, 0],
  [5, 1],
  [4, 0],
  [5, 0],
  [2, 1],
  [1, 0],
];
export function spriteFrame(sheet, direction, moving, time) {
  const columns = sheet.columns || 4;
  const cycle = sheet.cycleFrames || columns;
  const column = moving
    ? Math.floor(time / (sheet.frameMs || 90)) % cycle
    : sheet.idleFrame || 0;
  if (sheet.sequence?.length) {
    const frame =
      sheet.sequence[
        moving ? Math.floor(time / sheet.frameMs) % sheet.sequence.length : 0
      ];
    return {
      row: Math.floor(frame / columns),
      column: frame % columns,
      flip: false,
    };
  }
  if (sheet.rows === 1)
    return {
      row: 0,
      column,
      flip: !!sheet.mirrorWest && [5, 6, 7].includes(direction),
    };
  if (sheet.layout === "four") {
    const row = [0, 3, 3, 1, 1, 1, 2, 2][direction];
    const mirrored = sheet.mirrorWest && row === 2;
    return {
      row: mirrored ? 3 : row,
      column,
      flip: !!mirrored,
    };
  }
  const layout =
    sheet.layout === "eight"
      ? NORMAL
      : sheet.id === "costume-portfolio"
        ? TRAINER
        : sheet.id === "costume-contact"
          ? FAMILY
          : sheet.costume
            ? COSTUME
            : sheet.family
              ? FAMILY
              : NORMAL;
  const [row, flip] = sheet.directions?.[direction] || layout[direction];
  return {
    row,
    column,
    flip: !!flip !== !!sheet.mirrorRows?.includes(row),
  };
}
export function movementDirection(dx, dz) {
  return (Math.round(Math.atan2(dx, dz) / (Math.PI / 4)) + 8) % 8;
}

// A run has two airborne phases per stride. This small continuous lift preserves
// stable sprite anchors while giving the knees/arms an actual running bounce.
export function runningLift(sheet, moving, time) {
  if (!moving || sheet?.action !== "run" || sheet.rootAligned) return 0;
  return (
    0.1 *
    Math.sin(
      (time / ((sheet.frameMs || 120) * (sheet.columns || 4))) * Math.PI * 2,
    ) **
      2
  );
}
