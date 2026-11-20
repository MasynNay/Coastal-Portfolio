import { act } from "react";
import { createRoot } from "react-dom/client";
import Aquarium from "./Aquarium";

test("aquarium pause, app visibility, reduced motion, feeding, and touch gestures cooperate", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const oldObserver = global.ResizeObserver;
  const oldMotion = window.matchMedia;
  const motion = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const context = {
    fillRect: jest.fn(),
    fillText: jest.fn(),
    setTransform: jest.fn(),
  };
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  window.matchMedia = () => motion;
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context);
  jest
    .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
    .mockReturnValue({ width: 320, height: 280, left: 0, top: 0 });
  const request = jest
    .spyOn(window, "requestAnimationFrame")
    .mockReturnValue(45);
  const cancel = jest.spyOn(window, "cancelAnimationFrame");
  const button = (name) =>
    [...host.querySelectorAll("button")].find(
      (node) => node.textContent === name,
    );
  try {
    act(() => root.render(<Aquarium active />));
    expect(request).toHaveBeenCalledTimes(1);
    act(() => button("Feed Fish").click());
    expect(host.querySelector('[role="status"]').textContent).toContain(
      "Dinner is served",
    );
    act(() => button("Pause Scene").click());
    expect(cancel).toHaveBeenCalledWith(45);
    act(() => button("Feed Fish").click());
    expect(host.textContent).toContain("Resume the scene");
    act(() => button("Resume Scene").click());
    expect(request).toHaveBeenCalledTimes(2);
    act(() => root.render(<Aquarium active={false} />));
    expect(request).toHaveBeenCalledTimes(2);
    motion.matches = true;
    act(() => root.render(<Aquarium active />));
    expect(request).toHaveBeenCalledTimes(2);
    const canvas = host.querySelector("canvas");
    canvas.setPointerCapture = jest.fn();
    function pointer(type, x, y) {
      const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: y,
      });
      Object.defineProperties(event, {
        pointerId: { value: 7 },
        isPrimary: { value: true },
      });
      act(() => canvas.dispatchEvent(event));
    }
    pointer("pointerdown", 240, 100);
    pointer("pointerup", 90, 105);
    expect(canvas.getAttribute("aria-label")).toContain("Coral Cathedral");
    pointer("pointerdown", 100, 100);
    pointer("pointerup", 105, 230);
    expect(canvas.getAttribute("aria-label")).toContain("Coral Cathedral");
    expect(host.querySelector('[role="status"]').textContent).toContain(
      "Tap the water",
    );
    pointer("pointerdown", 150, 100);
    pointer("pointerup", 150, 100);
    expect(host.querySelector('[role="status"]').textContent).toContain(
      "Dinner is served",
    );
    act(() =>
      canvas.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      ),
    );
    expect(canvas.getAttribute("aria-label")).toContain("River Garden");
    const chooser = host.querySelector('select[aria-label="Choose Scene"]');
    function choose(id) {
      act(() => {
        chooser.value = id;
        chooser.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
    choose("orbit");
    expect(canvas.getAttribute("aria-label")).toContain("Meteor Shower");
    act(() => button("Meteor Shower").click());
    expect(host.querySelector('[role="status"]').textContent).toContain(
      "meteor shower",
    );
    choose("lanterns");
    expect(button("Release Lanterns")).toBeDefined();
    expect(host.querySelector('[role="status"]').textContent).toContain(
      "Tap the sky",
    );
  } finally {
    act(() => root.unmount());
    host.remove();
    global.ResizeObserver = oldObserver;
    window.matchMedia = oldMotion;
    jest.restoreAllMocks();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
