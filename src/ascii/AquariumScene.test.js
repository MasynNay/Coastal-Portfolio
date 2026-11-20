import { gameStyles, galaxyStyles, natureStyles } from "./Worlds";
import {
  aquariumStyles,
  createAquarium,
  feedAquarium,
  updateAquarium,
  renderAquarium,
} from "./AquariumScene";

const context = () => ({ fillRect: jest.fn(), fillText: jest.fn() });

test.each([...aquariumStyles, ...gameStyles, ...galaxyStyles, ...natureStyles])(
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
      ).toBeGreaterThan(style.category ? 200 : 1000);
      for (const [glyph, x, y] of ctx.fillText.mock.calls) {
        expect(glyph).toMatch(/^[\x20-\x7e]$/);
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(width);
        expect(y).toBeLessThan(height);
      }
      const a = { glyphs: [...grid.glyphs], colors: [...grid.colors] };
      for (let i = 0; i < 20; i++) updateAquarium(scene, 0.05);
      const b = renderAquarium(ctx, scene, width, height);
      expect({ glyphs: b.glyphs, colors: b.colors }).not.toEqual(a);
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

test("categories have meaningful membership, eighteen scenes each, and six scenes per game series", () => {
  const { bouquetStyles } = require("../bloom/Bouquet");
  for (const list of [aquariumStyles, gameStyles, galaxyStyles]) {
    expect(list).toHaveLength(bouquetStyles.length);
    expect(new Set(list.map((item) => item.id)).size).toBe(18);
  }
  expect(
    aquariumStyles.every((item) => !item.series && item.landscape !== "galaxy"),
  ).toBe(true);
  for (const series of ["Pokémon", "Kingdom Hearts", "Zelda"])
    expect(gameStyles.filter((item) => item.series === series)).toHaveLength(6);
  expect(
    galaxyStyles.every(
      (item) => item.category === "galaxy" && item.animals.length === 0,
    ),
  ).toBe(true);
  expect(new Set(galaxyStyles.map((item) => item.form)).size).toBeGreaterThan(
    12,
  );
});

test.each([
  ["starlight", 1],
  ["lanterns", -1],
  ["nectar", 1],
])(
  "%s interactions move in the appropriate environment",
  (action, direction) => {
    const scene = createAquarium(
      [...galaxyStyles, ...natureStyles].find(
        (style) => style.action === action,
      ),
    );
    feedAquarium(scene, 0.5);
    const before = scene.food[0].y;
    updateAquarium(scene, 0.05);
    expect((scene.food[0].y - before) * direction).toBeGreaterThan(0);
  },
);
