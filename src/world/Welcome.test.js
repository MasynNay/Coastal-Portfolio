import { createRoot } from "react-dom/client";
import { act } from "react";
import Welcome from "./Welcome";

beforeAll(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

jest.mock("./SpritePose", () => () => null);

test("the greeting waits for an explicit ready-button click, even after a long wait or Escape", () => {
  jest.useFakeTimers();
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host),
    close = jest.fn();
  act(() => root.render(<Welcome ready={false} onClose={close} />));
  act(() => host.querySelector("button").click());
  expect(close).not.toHaveBeenCalled();
  act(() => root.render(<Welcome ready onClose={close} />));
  act(() => {
    jest.advanceTimersByTime(60000);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
  expect(close).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(host.querySelector("button"));
  const tab = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
  });
  act(() => document.activeElement.dispatchEvent(tab));
  expect(tab.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(host.querySelector("button"));
  act(() => host.querySelector("button").click());
  expect(close).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
  host.remove();
  jest.useRealTimers();
});
