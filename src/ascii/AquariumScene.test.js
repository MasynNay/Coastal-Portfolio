import {
  aquariumStyles,
  createAquarium,
  feedAquarium,
  updateAquarium,
  renderAquarium,
} from "./AquariumScene";

const context = () => ({ fillRect: jest.fn(), fillText: jest.fn() });

test.each(aquariumStyles)(
  "$name draws a complete, bounded habitat at phone and desktop sizes",
  (style) => {
    const scene = createAquarium(style);
    for (const [width, height] of [
      [300, 280],
      [600, 420],
    ]) {
      const ctx = context();
      const grid = renderAquarium(ctx, scene, width, height);
      expect(
        grid.glyphs.filter((glyph) => glyph !== " ").length,
      ).toBeGreaterThan(1000);
      for (const [glyph, x, y] of ctx.fillText.mock.calls) {
        expect(glyph).toMatch(/^[\x20-\x7e]$/);
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(width);
        expect(y).toBeLessThan(height);
      }
      const a = [...grid.glyphs];
      for (let i = 0; i < 20; i++) updateAquarium(scene, 0.05);
      const b = renderAquarium(ctx, scene, width, height);
      expect(b.glyphs).not.toEqual(a);
    }
  },
);

test("feeding attracts swimmers, consumes pellets, caps excess food, and clears leftovers", () => {
  const scene = createAquarium();
  const fish = scene.creatures[0];
  fish.x = 0.5;
  fish.y = 0.25;
  scene.creatures = [fish];
  expect(feedAquarium(scene, 0.5)).toBe(true);
  for (let i = 0; i < 240; i++) updateAquarium(scene, 1 / 30);
  expect(scene.fed).toBeGreaterThan(0);
  expect(fish.y).toBeLessThan(0.25);
  for (let i = 0; i < 20; i++) feedAquarium(scene, 100);
  expect(scene.food.length).toBeLessThanOrEqual(24);
  expect(scene.food.every((food) => food.x <= 0.95)).toBe(true);
  expect(feedAquarium(scene)).toBe(false);
  scene.creatures = [];
  for (let i = 0; i < 450; i++) updateAquarium(scene, 1 / 30);
  expect(scene.food).toHaveLength(0);
});

test("a resumed tab cannot advance the tank by minutes or let creatures escape", () => {
  const scene = createAquarium();
  updateAquarium(scene, 600);
  expect(scene.time).toBe(0.08);
  for (let i = 0; i < 10000; i++) updateAquarium(scene, 0.08);
  for (const c of scene.creatures) {
    expect(c.x).toBeGreaterThanOrEqual(0.09);
    expect(c.x).toBeLessThanOrEqual(0.91);
    expect([-1, 1]).toContain(c.direction);
  }
});
