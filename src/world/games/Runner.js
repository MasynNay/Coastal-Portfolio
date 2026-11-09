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
export const coinDrawTime = 0.53;
export const fireClearTime = 0.45;
const magnetReach = 14;
const inputGrace = 0.14;
const obstacles = new Set(["crate", "rail", "arch"]);
const elements = ["air", "water", "fire", "earth"];

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
    elapsed: 0,
    lane: 1,
    visualLane: 1,
    distance: 0,
    coins: 0,
    coinScore: 0,
    hearts: 3,
    shield: 0,
    magnet: 0,
    multiplier: 0,
    effects: {},
    buffered: null,
    invulnerable: 0,
    nextPower: 66,
    message: "Follow the gold coins.",
    jump: 0,
    duck: 0,
    next: 48,
    safeLane: 1,
    row: 0,
    // Start with a clean center line so the first run teaches collection.
    objects: [
      { id: 0, lane: 1, kind: "coin", at: 16 },
      { id: 1, lane: 1, kind: "coin", at: 22 },
      { id: 2, lane: 1, kind: "coin", at: 28 },
      { id: 3, lane: 1, kind: "water", at: 35 },
    ],
    serial: 4,
    over: false,
  };
}
export function runnerAction(state, action) {
  if (state.over) return;
  if (action === "left") state.lane = Math.max(0, state.lane - 1);
  if (action === "right") state.lane = Math.min(2, state.lane + 1);
  if (action !== "jump" && action !== "duck") return;
  if (!tryStance(state, action))
    state.buffered = { action, until: state.elapsed + inputGrace };
}

function tryStance(state, action) {
  if (state.jump || state.duck > (action === "jump" ? 0.13 : 0)) return false;
  state.jump = action === "jump" ? runnerJumpTime : 0;
  state.duck = action === "duck" ? runnerSlideTime : 0;
  state.buffered = null;
  return true;
}

export function stepRunner(state, dt, random = Math.random) {
  // Resolve delayed visible frames in small steps so passing a coin or an
  // obstacle is independent of how often the canvas repaints.
  let remaining = Math.min(Math.max(0, dt), 0.12);
  while (remaining > 0 && !state.over) {
    const step = Math.min(1 / 120, remaining);
    advance(state, step, random);
    remaining -= step;
  }
  return state;
}

function advance(state, dt, random) {
  const speed = Math.min(28, 14 + state.distance / 95);
  state.elapsed += dt;
  state.distance += dt * speed;
  state.visualLane +=
    (state.lane - state.visualLane) * (1 - Math.exp(-dt * 20));
  for (const power of ["magnet", "multiplier", "invulnerable"])
    state[power] = Math.max(0, state[power] - dt);
  state.jump = Math.max(0, state.jump - dt);
  state.duck = Math.max(0, state.duck - dt);
  const buffered = state.buffered;
  if (buffered) {
    if (buffered.until < state.elapsed) state.buffered = null;
    else tryStance(state, buffered.action);
  }
  if (state.distance + 53 >= state.next) {
    const safe = Math.max(
      0,
      Math.min(2, state.safeLane + Math.floor(random() * 3) - 1),
    );
    const blocked = [0, 1, 2].filter((lane) => lane !== safe);
    const first = Math.floor(random() * blocked.length);
    const slots =
      state.row > 1 && state.row % 3 === 2 ? blocked : [blocked[first]];
    for (const lane of slots) {
      const kind = ["crate", "rail", "arch"][Math.floor(random() * 3)];
      state.objects.push({ id: state.serial++, lane, kind, at: state.next });
    }
    for (let n = 0; n < 3; n++)
      state.objects.push({
        id: state.serial++,
        lane: safe,
        kind: "coin",
        at: state.next - 4 + n * 3,
      });
    // Reward the marked route without placing a power on top of a coin.
    if (state.next >= state.nextPower) {
      state.objects.push({
        id: state.serial++,
        lane: safe,
        kind: elements[Math.floor(random() * elements.length)],
        at: state.next + 6,
      });
      state.nextPower = state.next + 88;
    }
    state.safeLane = safe;
    state.row++;
    state.next += state.row % 3 === 0 ? 23 : 17;
  }
  // Check the pickup lane at the crossing point. A missed item stays on the
  // road and scrolls past, even if a different power is active.
  for (const object of state.objects) {
    if (object.passed || object.checked || object.at > state.distance) continue;
    object.passed = true;
    if (Math.abs(state.visualLane - object.lane) > 0.4) continue;
    const { kind } = object;
    if (kind === "coin") {
      if (object.drawnAt == null) collectCoin(state, object);
    } else if (obstacles.has(kind)) {
      if (object.burningAt == null) collide(state, kind);
    } else {
      object.checked = true;
      activatePower(state, kind);
    }
  }
  for (const object of state.objects) {
    if (object.checked) continue;
    if (object.burningAt != null) {
      object.checked = state.elapsed - object.burningAt >= fireClearTime;
      continue;
    }
    if (object.kind !== "coin") continue;
    if (object.drawnAt != null) {
      if (state.elapsed - object.drawnAt >= coinDrawTime)
        collectCoin(state, object);
    } else {
      const ahead = object.at - state.distance;
      if (state.magnet > 0 && ahead >= 0 && ahead <= magnetReach) {
        object.drawnAt = state.elapsed;
        object.drawnAhead = ahead;
      }
    }
  }
  state.objects = state.objects.filter(
    (object) =>
      !object.checked &&
      (object.drawnAt != null || object.at - state.distance > -8),
  );
}

function collectCoin(state, coin) {
  coin.checked = true;
  state.coins++;
  const doubled = state.multiplier > 0;
  state.coinScore += doubled ? 20 : 10;
  state.coinFlash = state.elapsed;
  state.coinPoints = doubled ? 20 : 10;
}

function activatePower(state, kind) {
  state.effects[kind] = state.elapsed;
  if (kind === "air") {
    state.shield = 1;
    state.message = "Air shield · one hit protected";
  } else if (kind === "water") {
    state.magnet = 9;
    state.message = "Waterbending · draw in coins";
  } else if (kind === "fire") {
    state.message = "Firebending · clear the path!";
    state.coinScore += 50;
    for (const obstacle of state.objects) {
      const ahead = obstacle.at - state.distance;
      if (obstacles.has(obstacle.kind) && ahead >= 0 && ahead < 62)
        obstacle.burningAt ??= state.elapsed;
    }
  } else if (kind === "earth") {
    state.multiplier = 10;
    state.message = "Earth crystal · double coin points";
  }
}

function collide(state, kind) {
  const clears =
    kind === "arch"
      ? runnerSlideAmount(state) >= 0.65
      : runnerJumpHeight(state) > (kind === "rail" ? 32 : 44);
  if (clears || state.invulnerable > 0) return;
  if (state.shield) {
    state.shield = 0;
    state.effects.shieldBreak = state.elapsed;
    state.message = "Your air shield protected you!";
  } else {
    state.hearts--;
    state.message = "Keep going. Find an open lane.";
  }
  state.invulnerable = 1.2;
  state.over = state.hearts <= 0;
}
