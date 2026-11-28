import { climbingFrame, drawClimber } from "./PlaygroundPoses";
import { activityAsset } from "./Wardrobe";
import appearances from "./Appearances.json";
import sheets from "./ClimbArt.json";
import { climbRungs } from "./Playground";

test("climbing and celebrating render one complete full-size body cell for every costume", () => {
  for (const appearance of appearances) {
    const sheet =
      sheets[
        activityAsset(appearance.character, appearance.id, "climb", sheets)
      ];
    for (const stage of ["climbing", "climbing-net", "summit"]) {
      const ctx = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
      };
      expect(sheet.action).toBe("climb");
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
    climbingFrame({ stage: "climbing-net", climbCycle: i / 8 }),
  );
  expect(new Set(frames.map((f) => f.column))).toEqual(new Set([0, 1, 2, 3]));
  expect(frames.every((f) => f.direction === 4)).toBe(true);
  expect(climbingFrame({ celebrating: true, poseTime: 6000 }).direction).toBe(
    0,
  );
});

test("grips pause at rope junctions and the final step reaches the exact rung", () => {
  const points = [
    { x: 0, z: 0 },
    { x: 0.2, z: -1 },
    { x: -0.2, z: -2 },
  ];
  expect(climbRungs(points, 0.1).position).toEqual(points[0]);
  expect(climbRungs(points, 0.5).position).toEqual(points[1]);
  expect(climbRungs(points, 1).position).toEqual(points[2]);
  expect(climbingFrame({ celebrating: true, celebrateTime: 100 }).column).toBe(
    4,
  );
  expect(climbingFrame({ celebrating: true, celebrateTime: 300 }).column).toBe(
    5,
  );
});
