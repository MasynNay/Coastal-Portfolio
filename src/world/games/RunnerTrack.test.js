import { projectRunner, runnerCamera } from "./RunnerTrack";
test("fixed floor landmarks advance toward the feet as the camera travels", () => {
  let previous = -Infinity;
  for (let distance = 0; distance <= 60; distance += 0.25) {
    const p = projectRunner(1, 60 - distance);
    expect(p.y).toBeGreaterThan(previous);
    expect(p.x).toBe(runnerCamera.center);
    previous = p.y;
  }
  expect(projectRunner(1, 0).y).toBe(runnerCamera.feet);
});
test("all three lanes converge on the same vanishing point and stay symmetric", () => {
  for (const ahead of [0, 5, 20, 80]) {
    const left = projectRunner(0, ahead),
      right = projectRunner(2, ahead);
    expect(runnerCamera.center - left.x).toBeCloseTo(
      right.x - runnerCamera.center,
    );
    expect(left.y).toBe(right.y);
    expect(left.scale).toBe(right.scale);
  }
});
