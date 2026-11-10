import { startWindSong, windSongDuration, conductFrame } from "./WindStatue";
import {
  abilityActive,
  abilityLocksMovement,
  abilityColumn,
} from "./Abilities";
import appearances from "./Appearances.json";
import sheets from "./SpriteSheets.json";
import { authoredFrameIndex } from "./animation";
test("the statue preserves every wearer and holds movement only for the short performance", () => {
  for (const look of appearances) {
    const effect = startWindSong(
      { id: look.character, outfit: look.id, x: 2, z: 3 },
      100,
    );
    expect(effect.asset).toBe(look.asset + "-conduct");
    expect(abilityLocksMovement(effect, 101)).toBe(true);
    expect(abilityActive(effect, 100 + windSongDuration)).toBe(false);
    expect(abilityLocksMovement(effect, 100 + windSongDuration)).toBe(false);
    const frames = new Set();
    for (let t = 0; t < windSongDuration; t += windSongDuration / 12) {
      frames.add(abilityColumn(effect, 100 + t));
      expect(abilityColumn(effect, 100 + t)).toBe(
        authoredFrameIndex(sheets[effect.asset], conductFrame(t)),
      );
    }
    expect(frames.size).toBe(12);
  }
});
