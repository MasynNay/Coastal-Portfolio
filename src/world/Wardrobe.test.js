import {
  characterAsset,
  activityAsset,
  characterSelection,
  outfits,
} from "./Wardrobe";
import sheets from "./SpriteSheets.json";
test("every selectable outfit uses a real shipped atlas owned by its character", () => {
  for (const outfit of outfits.filter((o) => o.available !== false)) {
    expect(characterSelection("outfit:" + outfit.id)).toEqual({
      character: outfit.character,
      outfit: outfit.id,
    });
    expect(characterAsset(outfit.character, outfit.id)).toBe(outfit.asset);
    expect(sheets[outfit.asset].pixelArt).toBe(true);
    expect(!!sheets[outfit.asset].opaqueBody).toBe(!!outfit.opaqueBody);
    expect(!!sheets[outfit.asset + "-run"].opaqueBody).toBe(
      !!outfit.opaqueBody,
    );
  }
  expect(characterSelection("link")).toBe(null);
  expect(characterAsset("fallyn", "resume")).toBe("fallyn");
});

test("every outfit keeps its appearance for every ride, surfing and fishing", () => {
  for (const outfit of outfits.filter((o) => o.available !== false)) {
    for (const action of [
      "board-ride",
      "board-trick",
      "wake-ride",
      "water-ride",
      "bike-acro",
      "bike-mach",
      "surf",
      "fish",
      "fish-surf",
    ]) {
      const id = activityAsset(outfit.character, outfit.id, action, sheets);
      expect(id).toBe(outfit.asset + "-" + action);
      expect(sheets[id].rootAligned).toBe(true);
      expect(sheets[id].rows).toBe(8);
      expect(!!sheets[id].opaqueBody).toBe(!!outfit.opaqueBody);
    }
  }
});
