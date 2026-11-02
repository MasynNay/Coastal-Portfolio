import { createAxolotlScene } from "./AxolotlScene";
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
    256,
    128,
    128,
    128,
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
