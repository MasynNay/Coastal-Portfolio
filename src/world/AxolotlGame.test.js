import { act } from "react";
import { createRoot } from "react-dom/client";
import AxolotlGame from "./AxolotlGame";
import { createArtCache } from "./art";

jest.mock("./art", () => ({
  artwork: {
    "masyn-surf": { src: "/rider.png", cw: 128, ch: 144, bodyHeight: 96 },
  },
  createArtCache: jest.fn(),
  drawSprite: jest.fn(),
}));
let host, root, frames, now, next, cache, originalImage;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  frames = new Map();
  now = 0;
  next = 0;
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((fn) => {
    frames.set(++next, fn);
    return next;
  });
  jest
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation((id) => frames.delete(id));
  const context = new Proxy(
    { createLinearGradient: () => ({ addColorStop() {} }) },
    { get: (o, k) => (k in o ? o[k] : (o[k] = jest.fn())) },
  );
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context);
  originalImage = window.Image;
  window.Image = class {
    set src(_) {
      this.onload?.();
    }
  };
  cache = { load: jest.fn(async () => {}), get: () => ({}), clear: jest.fn() };
  createArtCache.mockReturnValue(cache);
  localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  window.Image = originalImage;
  jest.restoreAllMocks();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
function frame(dt) {
  now += dt;
  const pending = [...frames.values()];
  frames.clear();
  act(() => pending.forEach((fn) => fn(now)));
}
test("Space and touch share start/resume controls; held Space cannot spam flaps", async () => {
  await act(async () => root.render(<AxolotlGame />));
  expect(host.querySelector(".world-primary").disabled).toBe(false);
  const space = new KeyboardEvent("keydown", {
    key: " ",
    code: "Space",
    cancelable: true,
  });
  act(() => window.dispatchEvent(space));
  expect(space.defaultPrevented).toBe(true);
  expect(host.querySelector(".axolotl-game-message")).toBe(null);
  frame(0);
  frame(100);
  act(() => host.querySelector(".axolotl-game-score button").click());
  expect(host.textContent).toContain("A little breather");
  act(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", code: "Space", repeat: true }),
    ),
  );
  expect(host.textContent).toContain("A little breather");
  act(() =>
    host
      .querySelector("canvas")
      .dispatchEvent(
        new Event("pointerdown", { bubbles: true, cancelable: true }),
      ),
  );
  expect(host.querySelector(".axolotl-game-message")).toBe(null);
  act(() => root.unmount());
  expect(cache.clear).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
  // Events after unmount must not restart a hidden game or prevent scrolling.
  const after = new KeyboardEvent("keydown", {
    key: " ",
    code: "Space",
    cancelable: true,
  });
  window.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
  root = createRoot(host);
});
test("a failed required image blocks play instead of allowing invisible obstacles", async () => {
  cache.load.mockRejectedValueOnce(new Error("No rider image"));
  await act(async () => root.render(<AxolotlGame />));
  expect(host.querySelector(".world-primary").disabled).toBe(true);
  expect(host.textContent).toContain("Close the game and try again");
});
