import { climbingFrame, drawClimber } from "./PlaygroundPoses";
import { activityAsset } from "./Wardrobe";
import appearances from "./Appearances.json";
import sheets from "./SpriteSheets.json";

test("climbing and celebrating render one complete full-size body cell for every costume", () => {
  for (const appearance of appearances) {
    const sheet =
      sheets[
        activityAsset(
          appearance.character,
          appearance.id,
          "board-trick",
          sheets,
        )
      ];
    for (const stage of ["climbing", "climbing-net", "summit"]) {
      const ctx = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
      };
      expect(
        drawClimber(ctx, {}, sheet, { x: 100, y: 200 }, 80, {
          stage,
          celebrating: stage === "summit",
          poseTime: 6000,
        }),
      ).toBe(true);
      expect(ctx.drawImage).toHaveBeenCalledTimes(1);
      expect(ctx.scale.mock.calls[0][1]).toBe(80 / sheet.bodyHeight);
    }
  }
});
test("reach and pull passes through multiple poses and the summit faces the viewer", () => {
  const frames = Array.from({ length: 8 }, (_, i) =>
    climbingFrame({ stage: "climbing-net", poseTime: i * 87.5 }),
  );
  expect(new Set(frames.map((f) => f.column)).size).toBeGreaterThan(4);
  expect(frames.every((f) => f.direction === 4)).toBe(true);
  expect(climbingFrame({ celebrating: true, poseTime: 6000 }).direction).toBe(
    0,
  );
});
