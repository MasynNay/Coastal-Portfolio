import { spriteFrame, movementDirection } from "./animation";
import sheets from "./SpriteSheets.json";
test("walking uses every authored frame and standing returns to the idle frame", () => {
  const columns = sheets.masyn.cycleFrames || sheets.masyn.columns;
  expect(
    Array.from(
      { length: columns },
      (_, i) =>
        spriteFrame(sheets.masyn, 0, true, i * sheets.masyn.frameMs).column,
    ),
  ).toEqual(Array.from({ length: columns }, (_, i) => i));
  expect(
    spriteFrame(sheets.masyn, 0, true, columns * sheets.masyn.frameMs).column,
  ).toBe(0);
  expect(spriteFrame(sheets.masyn, 4, false, 330)).toEqual({
    row: 4,
    column: sheets.masyn.idleFrame || 0,
    flip: false,
  });
});
test("current family and costume atlases use their own native east and west rows", () => {
  for (const id of [
    "masyn",
    "mi-shell",
    "ezra",
    "fallyn",
    "fitzgerald",
    "costume-skills",
    "costume-portfolio",
    "costume-contact",
  ]) {
    expect(spriteFrame(sheets[id], 2, true, 0)).toMatchObject({
      row: 6,
      flip: false,
    });
    expect(spriteFrame(sheets[id], 6, true, 0)).toMatchObject({
      row: 2,
      flip: false,
    });
  }
});
test("screen movement chooses all eight directions, including diagonals", () => {
  expect(
    [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, -1],
      [-1, 0],
      [-1, 1],
    ].map(([x, z]) => movementDirection(x, z)),
  ).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
});
test("published walking sheets have one canonical direction order for every costume and family member", () => {
  const ids = [
    "masyn",
    "mi-shell",
    "fallyn",
    "ezra",
    "fitzgerald",
    "costume-skills",
    "costume-portfolio",
    "costume-resume",
    "costume-contact",
    "costume-airbender",
    "link",
    "costume-ezra-spider",
    "costume-fallyn-ladybug",
    "costume-fitzgerald-spider",
  ];
  for (const id of ids) {
    const sheet = sheets[id];
    expect(sheet.canonicalDirections).toBe(true);
    expect(spriteFrame(sheet, 5, true, 200)).toMatchObject({
      row: 3,
      flip: false,
    });
    expect(spriteFrame(sheet, 3, true, 200)).toMatchObject({
      row: 5,
      flip: false,
    });
    expect(spriteFrame(sheet, 6, true, 200)).toMatchObject({
      row: 2,
      flip: false,
    });
    expect(spriteFrame(sheet, 2, true, 200)).toMatchObject({
      row: 6,
      flip: false,
    });
  }
});
