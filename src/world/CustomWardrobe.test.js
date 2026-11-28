import {
  cleanWardrobes,
  cleanLook,
  customLookForAsset,
  defaultLook,
  familyIds,
  presetLook,
  readWardrobes,
  saveWardrobes,
  themes,
  wardrobeKey,
} from "./CustomWardrobe";
import { styledSpriteFrame } from "./WardrobePainter";
import { artwork } from "./art";

beforeEach(() => localStorage.removeItem(wardrobeKey));

test("themes are available for each character without assigning another person's costume", () => {
  for (const character of familyIds) {
    expect(themes).toHaveLength(18);
    for (const theme of themes) {
      const look = presetLook(character, theme);
      expect(look.enabled).toBe(true);
      expect(!look.base || character === "masyn").toBe(true);
      expect(!!look.base || look.top !== "original").toBe(true);
      expect(!!look.base || look.bottom !== "original").toBe(true);
    }
  }
  expect(
    cleanLook("ezra", { base: "resume", hair: "spiky", hat: "missing" }),
  ).toMatchObject({ base: null, hair: "original", hat: "original" });
});

test("saved clothing slots remain separate, and the same look resolves for every action atlas", () => {
  const saved = saveWardrobes({
    masyn: { ...defaultLook, base: "resume", top: "fire", hat: "crown" },
    ezra: {
      ...defaultLook,
      base: "spider-ezra",
      hair: "halfUp",
      bottom: "denim",
    },
  });
  expect(readWardrobes()).toEqual(saved);
  for (const asset of Object.keys(artwork).filter((id) =>
    id.startsWith("costume-resume-"),
  ))
    expect(customLookForAsset(asset, saved)).toBe(saved.masyn);
  expect(customLookForAsset("costume-ezra-spider-climb", saved)).toBe(
    saved.ezra,
  );
  expect(customLookForAsset("fish-clown", saved)).toBeNull();
  expect(
    customLookForAsset("masyn-run", {
      masyn: { ...saved.masyn, enabled: false },
    }),
  ).toBeNull();
  expect(cleanWardrobes({ unknown: { top: "martial" } })).toEqual({});
});

test("wardrobe recoloring preserves transparent margins, face pixels and authored frame anchors", () => {
  const pixels = new Uint8ClampedArray(128 * 144 * 4);
  const put = (x, y, rgba) => pixels.set(rgba, (y * 128 + x) * 4);
  const get = (x, y) =>
    Array.from(pixels.slice((y * 128 + x) * 4, (y * 128 + x) * 4 + 4));
  put(64, 55, [225, 151, 94, 255]); // face
  put(64, 78, [24, 94, 67, 255]); // hoodie
  put(64, 105, [44, 65, 87, 255]); // trousers
  put(65, 106, [0, 0, 0, 0]); // transparent region
  const context = {
    drawImage: jest.fn(),
    getImageData: () => ({ data: pixels }),
    putImageData: jest.fn(),
  };
  const getContext = jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context);
  try {
    const result = styledSpriteFrame(
      {},
      { ...artwork.masyn, revision: "wardrobe-test" },
      { row: 0, column: 0, flip: true },
      { ...defaultLook, top: "fire", bottom: "sand" },
      0,
    );
    expect(result).not.toBeNull();
    expect(get(64, 55)).toEqual([225, 151, 94, 255]);
    expect(get(64, 78)).not.toEqual([24, 94, 67, 255]);
    expect(get(64, 105)).not.toEqual([44, 65, 87, 255]);
    expect(get(65, 106)).toEqual([0, 0, 0, 0]);
    expect(result.sheet.fixedFrame).toEqual({ row: 0, column: 0, flip: true });
    expect(result.sheet.anchors[0]).toBe(64);
    expect(result.sheet.baselines[0]).toBe(128);
  } finally {
    getContext.mockRestore();
  }
});
