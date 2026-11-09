import { projectRunner, runnerCamera, runnerView } from "./RunnerTrack";

test("the winding bridge and follow camera preserve lane alignment", () => {
  const turnRight = runnerView(0, 1);
  const turnLeft = runnerView(110, 1);
  expect(turnRight(1, 28).x).toBeGreaterThan(runnerCamera.center);
  expect(turnLeft(1, 28).x).toBeLessThan(runnerCamera.center);
  expect(turnRight(1, 0).y).toBe(runnerCamera.feet);
  const following = runnerView(0, 2);
  expect(following(2, 28).x - following(1, 28).x).toBeCloseTo(
    turnRight(2, 28).x - turnRight(1, 28).x,
  );
});
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
