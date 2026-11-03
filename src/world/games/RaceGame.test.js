import { act } from "react";
import { createRoot } from "react-dom/client";
import RaceGame from "./RaceGame";

test("the standalone race completes with all five riders and releases its animation when closed", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  jest.spyOn(document, "hidden", "get").mockReturnValue(false);
  let tick,
    frame = 0;
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    tick = callback;
    return ++frame;
  });
  const cancel = jest
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation(() => {});
  const host = document.createElement("div"),
    root = createRoot(host);
  try {
    act(() => root.render(<RaceGame />));
    expect(host.querySelectorAll(".arcade-race-lane")).toHaveLength(5);
    act(() => host.querySelector("button").click());
    expect(host.querySelector("button").disabled).toBe(true);
    for (
      let time = 100;
      time <= 26000 && host.querySelector("button").disabled;
      time += 100
    ) {
      const currentTick = tick;
      act(() => currentTick(time));
    }
    expect(host.querySelector(".arcade-race-result").textContent).toMatch(
      /The winner of this race is .+!/,
    );
    expect(host.querySelectorAll(".race-crown")).toHaveLength(1);
    expect(host.querySelector("button").disabled).toBe(false);
    act(() => host.querySelector("button").click());
    act(() => root.unmount());
    expect(cancel).toHaveBeenCalled();
  } finally {
    jest.restoreAllMocks();
    jest.useRealTimers();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
