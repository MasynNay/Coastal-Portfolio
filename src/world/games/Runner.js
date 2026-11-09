// Element Runner simulation is independent of the canvas and input device.
// Rows are spaced far enough apart to react, and every row leaves a safe lane.
export const runnerActions = {
  a: "left",
  ArrowLeft: "left",
  d: "right",
  ArrowRight: "right",
  w: "jump",
  ArrowUp: "jump",
  s: "duck",
  ArrowDown: "duck",
  " ": "jump",
};
export const runnerJumpTime = 0.9;
export const runnerSlideTime = 0.85;

export function runnerJumpHeight(state) {
  return state.jump
    ? Math.sin((1 - state.jump / runnerJumpTime) * Math.PI) * 100
    : 0;
}

export function runnerSlideAmount(state) {
  if (!state.duck) return 0;
  // Ease down and rise at the end; the middle of the slide stays low.
  return Math.min(1, (runnerSlideTime - state.duck) / 0.09, state.duck / 0.13);
}
export function newRunner() {
  return {
    lane: 1,
    visualLane: 1,
    distance: 0,
    coins: 0,
    coinScore: 0,
    hearts: 3,
    shield: 0,
    magnet: 0,
    multiplier: 0,
    burst: 0,
    invulnerable: 0,
    nextPower: 22,
    message: "Follow the gold coins.",
    jump: 0,
    duck: 0,
    next: 4,
    objects: [],
    serial: 0,
    over: false,
  };
}
export function runnerAction(state, action) {
  if (state.over) return;
  if (action === "left") state.lane = Math.max(0, state.lane - 1);
  if (action === "right") state.lane = Math.min(2, state.lane + 1);
  if (action === "jump" && state.jump === 0 && state.duck < 0.13) {
    state.jump = runnerJumpTime;
    state.duck = 0;
  }
  if (action === "duck" && state.jump === 0 && state.duck === 0)
    state.duck = runnerSlideTime;
}
export function stepRunner(state, dt, random = Math.random) {
  if (state.over) return state;
  // Clamp tab-resume gaps; the component also pauses when the page is hidden.
  dt = Math.min(dt, 0.05);
  const speed = Math.min(24, 12 + state.distance / 180);
  state.distance += dt * speed;
  state.visualLane +=
    (state.lane - state.visualLane) * (1 - Math.exp(-dt * 20));
  for (const power of ["magnet", "multiplier", "burst", "invulnerable"])
    state[power] = Math.max(0, state[power] - dt);
  state.jump = Math.max(0, state.jump - dt);
  state.duck = Math.max(0, state.duck - dt);
  if (state.distance >= state.next) {
    const lane = Math.floor(random() * 3),
      kind = ["crate", "rail", "arch"][Math.floor(random() * 3)];
    state.objects.push({
      id: state.serial++,
      lane,
      kind,
      at: state.distance + 48,
    });
    const safe = (lane + 1 + Math.floor(random() * 2)) % 3;
    for (let n = 0; n < 3; n++)
      state.objects.push({
        id: state.serial++,
        lane: safe,
        kind: "coin",
        at: state.distance + 47 + n * 3,
      });
    state.next += 16;
  }
  if (state.distance >= state.nextPower) {
    state.objects.push({
      id: state.serial++,
      lane: Math.floor(random() * 3),
      kind: ["air", "water", "fire", "earth"][Math.floor(random() * 4)],
      at: state.distance + 58,
    });
    state.nextPower += 100;
  }
  const collect = () => {
    state.coins++;
    state.coinScore += state.multiplier > 0 ? 20 : 10;
  };
  for (const object of state.objects) {
    if (
      !object.checked &&
      object.kind === "coin" &&
      state.magnet > 0 &&
      object.at - state.distance < 12 &&
      object.at >= state.distance
    ) {
      object.checked = true;
      collect();
      continue;
    }

    if (object.checked || object.at - state.distance > 0) continue;
    object.checked = true;
    if (Math.abs(state.visualLane - object.lane) > 0.4) continue;
    if (object.kind === "air") {
      state.shield = 1;
      state.message = "Air shield · one hit protected";
    } else if (object.kind === "water") {
      state.magnet = 9;
      state.message = "Waterbending · draw in coins";
    } else if (object.kind === "fire") {
      state.burst = 0.8;
      state.message = "Firebending · clear the path!";
      state.coinScore += 50;
      for (const near of state.objects)
        if (
          ["crate", "rail", "arch"].includes(near.kind) &&
          near.at - state.distance < 70
        )
          near.checked = true;
    } else if (object.kind === "earth") {
      state.multiplier = 10;
      state.message = "Earth crystal · double coin points";
    } else if (object.kind === "coin") collect();
    else {
      const highEnough =
        runnerJumpHeight(state) > (object.kind === "rail" ? 32 : 44);
      if (
        (object.kind === "arch"
          ? runnerSlideAmount(state) < 0.65
          : !highEnough) &&
        state.invulnerable <= 0
      ) {
        if (state.shield) {
          state.shield = 0;
          state.message = "Your air shield protected you!";
        } else {
          state.hearts--;
          state.message = "Keep going. Find an open lane.";
        }
        state.invulnerable = 1.2;
        if (state.hearts <= 0) state.over = true;
      }
    }
  }
  state.objects = state.objects.filter(
    (object) => object.at - state.distance > -8,
  );
  return state;
}
