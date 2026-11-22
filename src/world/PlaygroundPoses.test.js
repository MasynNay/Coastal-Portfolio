import { drawClimber } from "./PlaygroundPoses";
import appearances from "./Appearances.json";
import sheets from "./SpriteSheets.json";
test("summit hands rise outside the head rather than crossing through the face, in every outfit", () => {
  for (const appearance of appearances) {
    const sheet = sheets[appearance.asset];
    if (!sheet) continue;
    const ctx = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
    };
    expect(
      drawClimber(ctx, {}, sheet, { x: 100, y: 200 }, 80, {
        celebrating: true,
        poseTime: 6000,
      }),
    ).toBe(true);
    const left = ctx.rotate.mock.calls[2][0],
      right = ctx.rotate.mock.calls[3][0];
    expect(left).toBeGreaterThan(2);
    expect(right).toBeLessThan(-2);
    // A downward arm vector must rotate outward and upward on each side.
    expect(-Math.sin(left)).toBeLessThan(0);
    expect(Math.cos(left)).toBeLessThan(0);
    expect(-Math.sin(right)).toBeGreaterThan(0);
    expect(Math.cos(right)).toBeLessThan(0);
  }
});
