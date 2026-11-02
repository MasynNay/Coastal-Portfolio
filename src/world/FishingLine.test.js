import { drawFishingLine } from "./FishingLine";
import sheets from "./SpriteSheets.json";
test("illustrated rods get a line and bobber without a second rod stroke", () => {
  const ctx = new Proxy(
    {},
    {
      get: (o, k) => o[k] || (o[k] = jest.fn()),
      set: (o, k, v) => {
        o[k] = v;
        return true;
      },
    },
  );
  drawFishingLine(
    ctx,
    (x, z) => ({ x, y: z }),
    20,
    { x: 0, z: 0 },
    { x: 3, z: 2 },
    800,
    "waiting",
    false,
    2.25,
    { x: 18, y: -20 },
  );
  expect(ctx.moveTo.mock.calls[0]).toEqual([18, -20]);
  expect(ctx.lineTo).not.toHaveBeenCalled();
  ctx.lineTo.mockClear();
  drawFishingLine(
    ctx,
    (x, z) => ({ x, y: z }),
    20,
    { x: 0, z: 0 },
    { x: 3, z: 2 },
    800,
    "waiting",
    true,
    2.25,
    null,
  );
  expect(ctx.lineTo).toHaveBeenCalledTimes(1);
  for (const character of ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"])
    for (const suffix of ["-fish", "-fish-surf"]) {
      const s = sheets[character + suffix];
      expect(s.rootAligned).toBe(true);
      expect(s.illustratedRod).toBe(false);
      expect(s.rodTips).toBeUndefined();
    }
});
