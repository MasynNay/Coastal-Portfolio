import { createFrameLoop } from "./frameLoop";
function fakeFrames() {
  let id = 0;
  const pending = new Map();
  return {
    request: (fn) => {
      pending.set(++id, fn);
      return id;
    },
    cancel: (n) => pending.delete(n),
    run(time) {
      const [key, fn] = pending.entries().next().value;
      pending.delete(key);
      fn(time);
    },
    get count() {
      return pending.size;
    },
  };
}
test("idle scenes stop requesting frames and repeated input does not stack loops", () => {
  const frames = fakeFrames(),
    step = jest.fn(() => false),
    loop = createFrameLoop(step, frames);
  loop.wake();
  loop.wake();
  expect(frames.count).toBe(1);
  frames.run(0);
  expect(step).toHaveBeenCalledTimes(1);
  expect(frames.count).toBe(0);
});
test("movement resumes with a clamped delta and disposal cancels queued work", () => {
  const frames = fakeFrames(),
    step = jest.fn(() => true),
    loop = createFrameLoop(step, frames);
  loop.wake();
  frames.run(0);
  frames.run(2000);
  expect(step.mock.calls[1][1]).toBe(2);
  loop.dispose();
  expect(frames.count).toBe(0);
  loop.wake();
  expect(frames.count).toBe(0);
});
test("sleep cancels hidden-tab work and resets elapsed time on resume", () => {
  const frames = fakeFrames(),
    step = jest.fn(() => true),
    loop = createFrameLoop(step, frames);
  loop.wake();
  frames.run(10);
  loop.sleep();
  expect(frames.count).toBe(0);
  loop.wake();
  frames.run(10000);
  expect(step.mock.calls[1][1]).toBe(0);
  loop.dispose();
});
test("initial input paints movement immediately with one continuation", () => {
  const frames = fakeFrames(),
    step = jest.fn(() => true),
    loop = createFrameLoop(step, frames);
  loop.wake({
    immediate: true,
  });
  expect(step).toHaveBeenCalledTimes(1);
  expect(step.mock.calls[0][1]).toBeGreaterThan(0);
  expect(frames.count).toBe(1);
  loop.wake({
    immediate: true,
  });
  expect(step).toHaveBeenCalledTimes(1);
  loop.dispose();
});
test("watchdog advances a frame when keyboard processing starves animation callbacks", () => {
  const frames = fakeFrames();
  let timeout;
  const step = jest.fn(() => true),
    loop = createFrameLoop(step, {
      ...frames,
      schedule: (fn) => {
        timeout = fn;
        return 1;
      },
      unschedule: () => {},
      clock: () => 100,
    });
  loop.wake();
  timeout();
  expect(step).toHaveBeenCalledTimes(1);
  expect(frames.count).toBe(1);
  loop.dispose();
});
