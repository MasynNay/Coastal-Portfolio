import { act } from "react";
import { createRoot } from "react-dom/client";
import Bloom from "./Bloom";
import {
  createBouquet,
  createFrame,
  renderBouquet,
  terminalColor,
} from "./Bouquet";

function drawingContext() {
  return {
    clearRect: jest.fn(),
    fillText: jest.fn(),
    setTransform: jest.fn(),
    measureText: () => ({ width: 5 }),
  };
}

test("the browser port draws colored text at every quarter-turn and stays within the character grid", () => {
  const scene = createBouquet();
  const frame = createFrame(110, 40);
  expect(scene.flowers).toHaveLength(10);
  for (const time of [0, Math.PI / 1.2, Math.PI / 0.6, Math.PI / 0.4]) {
    const context = drawingContext();
    renderBouquet(context, scene, frame, time, 5, 10);
    expect(context.fillText.mock.calls.length).toBeGreaterThan(100);
    expect(
      frame.characters.filter((glyph) => glyph !== " ").length,
    ).toBeGreaterThan(300);
    context.fillText.mock.calls.forEach(([text, x, y]) => {
      expect(text.trim()).not.toBe("");
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(550);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(400);
    });
    expect(context.fillStyle).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  }
});

test("the same scene and elapsed time reproduce the paused frame exactly", () => {
  const frame = createFrame(60, 30);
  renderBouquet(drawingContext(), createBouquet(), frame, 4, 5, 10);
  const characters = [...frame.characters];
  const colors = [...frame.colors];
  renderBouquet(drawingContext(), createBouquet(), frame, 4, 5, 10);
  expect(frame.characters).toEqual(characters);
  expect([...frame.colors]).toEqual(colors);
  expect(terminalColor(16)).toBe("rgb(0, 0, 0)");
  expect(terminalColor(231)).toBe("rgb(255, 255, 255)");
  expect(terminalColor(232)).toBe("rgb(8, 8, 8)");
});

test("the dock app pauses its frame loop when minimized or inactive and honors reduced motion", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  const root = createRoot(host);
  document.body.appendChild(host);
  const context = drawingContext();
  const motion = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const originalObserver = global.ResizeObserver;
  const originalMatchMedia = window.matchMedia;
  const disconnect = jest.fn();
  let resize;
  global.ResizeObserver = class {
    constructor(callback) {
      resize = callback;
    }
    observe() {}
    disconnect() {
      disconnect();
    }
  };
  window.matchMedia = () => motion;
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context);
  jest
    .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
    .mockReturnValue({ width: 300, height: 300 });
  const request = jest
    .spyOn(window, "requestAnimationFrame")
    .mockReturnValue(42);
  const cancel = jest.spyOn(window, "cancelAnimationFrame");
  try {
    act(() => root.render(<Bloom active />));
    expect(host.textContent).toContain("For Mi Shell");
    expect(host.textContent).toContain("I love you.");
    expect(host.textContent).toContain("— Masyn");
    expect(host.querySelector('canvas[role="img"]')).not.toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    const pause = [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "Pause Rotation",
    );
    act(() => pause.click());
    expect(pause.textContent).toBe("Resume Rotation");
    expect(cancel).toHaveBeenCalledWith(42);
    expect(request).toHaveBeenCalledTimes(1);
    act(() => host.querySelectorAll("button")[1].click());
    expect(pause.textContent).toBe("Pause Rotation");
    expect(request).toHaveBeenCalledTimes(2);
    act(() => root.render(<Bloom active={false} />));
    expect(request).toHaveBeenCalledTimes(2);
    motion.matches = true;
    act(() => root.render(<Bloom active />));
    expect(request).toHaveBeenCalledTimes(2);
    const draws = context.clearRect.mock.calls.length;
    act(() => resize());
    expect(context.clearRect.mock.calls.length).toBe(draws + 1);
    expect(host.querySelector("canvas").width).toBeGreaterThanOrEqual(300);
  } finally {
    act(() => root.unmount());
    host.remove();
    expect(disconnect).toHaveBeenCalled();
    global.ResizeObserver = originalObserver;
    window.matchMedia = originalMatchMedia;
    jest.restoreAllMocks();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
