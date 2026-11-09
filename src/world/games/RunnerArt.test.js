import { createRunnerArt } from "./RunnerArt";
test("every actor, obstacle and power-up survives loader eviction", async () => {
  const loaded = new Map(),
    images = new Map();
  const cache = {
    get: (id) => loaded.get(id),
    load: async (id) => {
      const image = { id };
      images.set(id, image);
      loaded.clear();
      loaded.set(id, image);
      return image;
    },
    clear: () => loaded.clear(),
  };
  const art = createRunnerArt("masyn-run", cache);
  await art.load();
  expect(images.size).toBe(10);
  for (const [id, image] of images) expect(art.get(id)).toBe(image);
  expect(loaded.size).toBe(0);
  art.clear();
  for (const id of images.keys()) expect(art.get(id)).toBeUndefined();
});

test("closing during loading cannot restore discarded game images", async () => {
  const pending = [];
  const art = createRunnerArt("masyn-run", {
    load: (id) => new Promise((resolve) => pending.push(() => resolve({ id }))),
    clear: jest.fn(),
  });
  const ready = art.load();
  art.clear();
  pending.forEach((resolve) => resolve());
  await ready;
  expect(art.get("runner-crate")).toBeUndefined();
  expect(art.get("masyn-run")).toBeUndefined();
});
