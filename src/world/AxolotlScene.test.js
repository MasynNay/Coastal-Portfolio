import { createAxolotlScene } from "./AxolotlScene";

test("the ceiling and floor eels share the same painted face and opening", () => {
  const ctx = new Proxy(
    { createLinearGradient: () => ({ addColorStop() {} }) },
    { get: (o, k) => (k in o ? o[k] : (o[k] = jest.fn())) },
  );
  const eels = [{}, {}, {}];
  const paint = createAxolotlScene(ctx, {
    images: { eels },
    getRider: () => null,
    sheet: {},
    ratio: 1,
  });
  paint({ eels: [{ x: 100, center: 225 }], distance: 0 }, 190);
  const mouths = ctx.drawImage.mock.calls.filter(
    ([image]) => image === eels[1],
  );
  expect(mouths).toHaveLength(2);
  expect(mouths[0]).toEqual(mouths[1]);
  expect(ctx.scale).toHaveBeenCalledWith(1, -1);
  expect(ctx.translate).toHaveBeenCalledWith(138, 132.5);
  expect(ctx.translate).toHaveBeenCalledWith(138, 317.5);
});

test("the seabed uses the real sand texture and scrolls with round distance, not wall time", () => {
  const ctx = new Proxy(
    { createLinearGradient: () => ({ addColorStop() {} }) },
    { get: (o, k) => (k in o ? o[k] : (o[k] = jest.fn())) },
  );
  const sand = { width: 512, height: 512 };
  const paint = createAxolotlScene(ctx, {
    images: { sand },
    getRider: () => null,
    sheet: {},
    ratio: 1,
  });
  const state = { eels: [], distance: 0, y: 220, velocity: 0 };
  paint(state, 0);
  expect(ctx.drawImage).toHaveBeenCalledWith(
    sand,
    257,
    129,
    126,
    126,
    -48,
    0,
    96,
    96,
  );
  const stationary = ctx.translate.mock.calls.map((p) => [...p]);
  ctx.translate.mockClear();
  paint(state, 5000);
  expect(ctx.translate.mock.calls).toEqual(stationary);
  ctx.translate.mockClear();
  paint({ ...state, distance: 150 }, 6000);
  expect(ctx.translate).toHaveBeenCalledWith(-12, 450);
  expect(ctx.ellipse).not.toHaveBeenCalled();
});
