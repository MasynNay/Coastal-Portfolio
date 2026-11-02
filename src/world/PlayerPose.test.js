import { playerPose } from "./PlayerPose";
import { spriteFrame } from "./animation";
import sheets from "./SpriteSheets.json";
const family = ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"];
test("every family member stays on their own axolotl for all four fishing directions", () => {
  for (const character of family)
    for (const direction of [0, 2, 4, 6]) {
      const pose = playerPose({
        character,
        direction,
        surfing: true,
        action: "fish",
      });
      expect(pose).toBe(character + "-fish-surf");
      expect(sheets[pose].mounted).toBe(true);
      expect(
        spriteFrame(sheets[pose], direction, true, 500).row,
      ).toBeGreaterThanOrEqual(0);
      expect(
        playerPose({
          character,
          surfing: true,
        }),
      ).toBe(character + "-surf");
      expect(
        playerPose({
          character,
          surfing: false,
          action: "fish",
        }),
      ).toBe(character + "-fish");
    }
});
test("east and west casts use opposite facing instead of turning around mid-cast", () => {
  for (const character of family)
    for (const action of ["-fish", "-fish-surf"])
      for (const time of [0, 160, 320, 480]) {
        const east = spriteFrame(sheets[character + action], 2, true, time);
        const west = spriteFrame(sheets[character + action], 6, true, time);
        expect(east.row).toBe(6);
        expect(east.flip).toBe(false);
        expect(west.row).toBe(2);
        expect(west.flip).toBe(false);
        expect(east.column).toBe(west.column);
        expect(spriteFrame(sheets[character + action], 4, true, time).row).toBe(
          4,
        );
        expect(spriteFrame(sheets[character + action], 0, true, time).row).toBe(
          0,
        );
      }
});

test("Shift selects a dedicated eight-direction run cycle for every person and outfit", () => {
  const wardrobe = require("./Wardrobe").outfits;
  const choices = [
    ...family.map((character) => ({
      character,
      outfit: null,
      asset: character,
    })),
    ...wardrobe,
  ];
  for (const { character, id, outfit, asset } of choices) {
    for (let direction = 0; direction < 8; direction++) {
      const state = {
        character,
        outfit: id || outfit,
        moving: true,
        direction,
      };
      expect(playerPose({ ...state, running: false })).toBe(asset);
      expect(playerPose({ ...state, running: true })).toBe(asset + "-run");
      expect(sheets[asset + "-run"].rows).toBe(8);
      expect(sheets[asset + "-run"].src).not.toBe(sheets[asset].src);
      expect(playerPose({ ...state, running: true, moving: false })).toBe(
        asset,
      );
    }
  }
});
