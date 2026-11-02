import { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import TypingTest from "./TypingTest";

beforeAll(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test("a round waits for typing, pauses with its window, resumes and saves exactly once at the deadline", () => {
  jest.useFakeTimers();
  let now = 0;
  const time = jest.spyOn(performance, "now").mockImplementation(() => now);
  localStorage.clear();
  const host = document.createElement("div"),
    root = createRoot(host);
  document.body.appendChild(host);
  act(() => root.render(<TypingTest />));
  now = 30000;
  act(() => jest.advanceTimersByTime(30000));
  expect(host.querySelector(".typing-metrics strong").textContent).toBe("30s");
  const first = host.querySelector(".typing-word").textContent.trim();
  act(() =>
    Simulate.change(host.querySelector("textarea"), {
      target: { value: first + " " },
    }),
  );
  now += 10000;
  act(() => jest.advanceTimersByTime(10000));
  act(() => root.render(<TypingTest active={false} />));
  expect(host.textContent).toContain("Your time is paused");
  now += 90000;
  act(() => jest.advanceTimersByTime(90000));
  expect(host.querySelector(".typing-metrics strong").textContent).toBe("20s");
  act(() => root.render(<TypingTest active />));
  act(() =>
    Simulate.change(host.querySelector("textarea"), {
      target: { value: first + " a" },
    }),
  );
  now += 20001;
  act(() => jest.advanceTimersByTime(20100));
  expect(host.textContent).toContain("ROUND COMPLETE");
  expect(
    JSON.parse(localStorage.getItem("masyn-typeninja-scores-v1")),
  ).toHaveLength(1);
  now += 10000;
  act(() => jest.advanceTimersByTime(10000));
  expect(
    JSON.parse(localStorage.getItem("masyn-typeninja-scores-v1")),
  ).toHaveLength(1);
  act(() => root.unmount());
  host.remove();
  time.mockRestore();
  jest.useRealTimers();
  localStorage.clear();
});
