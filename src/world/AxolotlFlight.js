// Fixed logical coordinates let phones, tablets and desktop share the same
// difficulty. The canvas scales this simulation; screen pixels never affect it.
export const flightSize = { width: 430, height: 480, floor: 450 };
// The outdoor fountain keeps the same accessible E/touch arcade label.
export const axolotlArcade = { label: "Play Axolotl Drift" };
export const flightRules = {
  speed: 150,
  gravity: 760,
  boost: -275,
  gap: 185,
  spacing: 280,
  eelWidth: 76,
};
export function createAxolotlFlight(random = Math.random) {
  let state;
  let nextId = 0;
  function reset() {
    nextId = 0;
    state = {
      phase: "ready",
      y: 220,
      velocity: 0,
      score: 0,
      distance: 0,
      elapsed: 0,
      eels: [],
    };
    return snapshot();
  }
  function snapshot() {
    return { ...state, eels: state.eels.map((eel) => ({ ...eel })) };
  }
  function spawn(x) {
    return {
      id: nextId++,
      x,
      counted: false,
      center: 145 + Math.max(0, Math.min(1, random())) * 155,
    };
  }
  function step(dt) {
    const { gravity, speed, spacing, eelWidth, gap } = flightRules;
    state.elapsed += dt;
    state.distance += speed * dt;
    // Exact constant-acceleration integration avoids changing jump height with FPS.
    state.y += state.velocity * dt + (gravity * dt * dt) / 2;
    state.velocity += gravity * dt;
    if (!state.eels.length) state.eels.push(spawn(flightSize.width + 45));
    for (const eel of state.eels) eel.x -= speed * dt;
    const last = state.eels[state.eels.length - 1];
    if (last.x <= flightSize.width + 30)
      state.eels.push(spawn(last.x + spacing));
    state.eels = state.eels.filter((eel) => eel.x + eelWidth > -20);
    // A small inset follows the rider/mount, not transparent sprite padding or
    // the fishing/surf artwork's decorative splash. Eel tips share this gap.
    const rider = {
      left: 126,
      right: 166,
      top: state.y - 22,
      bottom: state.y + 17,
    };
    if (rider.top <= 0 || rider.bottom >= flightSize.floor)
      state.phase = "over";
    for (const eel of state.eels) {
      if (
        rider.right > eel.x + 5 &&
        rider.left < eel.x + eelWidth - 5 &&
        (rider.top < eel.center - gap / 2 ||
          rider.bottom > eel.center + gap / 2)
      )
        state.phase = "over";
      if (
        !eel.counted &&
        eel.x + eelWidth < rider.left &&
        state.phase === "playing"
      ) {
        eel.counted = true;
        state.score++;
      }
    }
  }
  reset();
  return {
    reset,
    snapshot,
    flap() {
      if (state.phase === "over") reset();
      state.phase = "playing";
      state.velocity = flightRules.boost;
      return snapshot();
    },
    update(dt) {
      if (state.phase === "playing") {
        // Bounded substeps make collision reliable even after a delayed frame.
        let remaining = Math.max(0, Math.min(0.1, dt));
        while (remaining > 0 && state.phase === "playing") {
          const stepTime = Math.min(remaining, 1 / 120);
          step(stepTime);
          remaining -= stepTime;
        }
      }
      return snapshot();
    },
  };
}
