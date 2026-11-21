import figures from "./CharacterFrames.json";
import sources from "./CharacterSources.json";
const tokens =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";

test("compiled reference frames have complete palettes, crops, timing, and source records", () => {
  expect(Object.keys(figures).sort()).toEqual(sources.map((s) => s.id).sort());
  for (const source of sources) {
    expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(source.credit.length).toBeGreaterThan(20);
    const figure = figures[source.id];
    expect(figure.width).toBeGreaterThan(0);
    expect(figure.height).toBe(64);
    expect(figure.durations).toHaveLength(figure.frames.length);
    expect(figure.durations.every((d) => Number.isFinite(d) && d > 0)).toBe(
      true,
    );
    expect(
      figure.palette.every(
        (rgb) =>
          rgb.length === 3 &&
          rgb.every((c) => Number.isInteger(c) && c >= 0 && c <= 255),
      ),
    ).toBe(true);
    for (const frame of figure.frames) {
      expect(frame).toHaveLength(figure.height);
      expect(frame.some((row) => row.trim().length > 0)).toBe(true);
      for (const row of frame) {
        expect(row.length).toBeLessThanOrEqual(figure.width);
        const indices = [...row]
          .filter((token) => token !== " ")
          .map((token) => tokens.indexOf(token));
        expect(
          indices.every((index) => index >= 0 && index < figure.palette.length),
        ).toBe(true);
      }
    }
  }
});

test("animated Pokémon and Sora retain multiple distinct reference poses", () => {
  for (const id of [
    "pikachu",
    "eevee",
    "gengar",
    "dragonite",
    "magikarp",
    "horsea",
    "lapras",
    "squirtle",
    "poliwag",
    "psyduck",
    "sora",
  ])
    expect(
      new Set(figures[id].frames.map((frame) => frame.join("\n"))).size,
    ).toBeGreaterThan(1);
});
