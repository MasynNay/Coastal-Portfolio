import { createPointerInput } from "./PointerInput";
let canvas, input, time, onTap, onZoom, onPinch, enabled;
function pointer(type, id = 1, x = 40, y = 50, pointerType = "touch") {
  const e = new Event(type, { cancelable: true });
  Object.assign(e, {
    pointerId: id,
    pointerType,
    clientX: x,
    clientY: y,
    button: 0,
  });
  canvas.dispatchEvent(e);
}
beforeEach(() => {
  time = 0;
  enabled = true;
  canvas = document.createElement("canvas");
  canvas.setPointerCapture = jest.fn();
  canvas.hasPointerCapture = () => true;
  canvas.releasePointerCapture = (id) => pointer("lostpointercapture", id);
  onTap = jest.fn(() => ({ x: 12, z: 9 }));
  onZoom = jest.fn();
  onPinch = jest.fn();
  input = createPointerInput(canvas, {
    enabled: () => enabled,
    onTap,
    onZoom,
    onPinch,
    clock: () => time,
  });
});
afterEach(() => input.dispose());
test("a single touch walks on release, not before the gesture is known", () => {
  pointer("pointerdown");
  expect(onTap).not.toHaveBeenCalled();
  time = 80;
  pointer("pointerup");
  expect(onTap).toHaveBeenCalledWith(expect.anything(), false, null);
});
test("double tap runs to the original world destination even if the camera moved", () => {
  pointer("pointerdown");
  time = 60;
  pointer("pointerup");
  time = 180;
  pointer("pointerdown", 2, 42, 52);
  time = 220;
  pointer("pointerup", 2, 42, 52);
  expect(onTap).toHaveBeenLastCalledWith(expect.anything(), true, {
    x: 12,
    z: 9,
  });
});
test("distant taps and slow repeats each walk", () => {
  pointer("pointerdown");
  pointer("pointerup");
  time = 100;
  pointer("pointerdown", 2, 140);
  pointer("pointerup", 2, 140);
  time = 600;
  pointer("pointerdown", 3, 140);
  pointer("pointerup", 3, 140);
  expect(onTap.mock.calls.map((c) => c[1])).toEqual([false, false, false]);
});
test("dragging, long presses and cancelled touches never start a route", () => {
  pointer("pointerdown");
  pointer("pointermove", 1, 90);
  pointer("pointerup", 1, 90);
  pointer("pointerdown", 2);
  time = 700;
  pointer("pointerup", 2);
  pointer("pointerdown", 3);
  pointer("pointercancel", 3);
  pointer("pointerup", 3);
  expect(onTap).not.toHaveBeenCalled();
});
test("pinch zoom stops the route and never becomes a tap when fingers lift", () => {
  pointer("pointerdown", 1, 0, 0);
  pointer("pointerdown", 2, 100, 0);
  pointer("pointermove", 2, 150, 0);
  expect(onPinch).toHaveBeenCalledTimes(1);
  expect(onZoom.mock.calls[0][0]).toBeGreaterThan(0);
  pointer("pointerup", 1, 0, 0);
  pointer("pointerup", 2, 150, 0);
  expect(onTap).not.toHaveBeenCalled();
});
test("panels and disposal block gestures, and mouse movement remains immediate", () => {
  enabled = false;
  pointer("pointerdown");
  pointer("pointerup");
  expect(onTap).not.toHaveBeenCalled();
  enabled = true;
  pointer("pointerdown", 1, 40, 50, "mouse");
  expect(onTap).toHaveBeenCalledTimes(1);
  input.dispose();
  pointer("pointerdown", 2, 40, 50, "mouse");
  expect(onTap).toHaveBeenCalledTimes(1);
});
