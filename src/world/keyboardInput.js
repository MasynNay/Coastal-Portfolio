const DIRECTIONS = {
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
  ShiftLeft: "shift",
  ShiftRight: "shift",
  KeyE: "e",
  KeyQ: "ability",
  Space: "stop",
};
const LEGACY_KEYS = {
  16: "shift",
  32: "stop",
  37: "arrowleft",
  38: "arrowup",
  39: "arrowright",
  40: "arrowdown",
  65: "a",
  68: "d",
  69: "e",
  81: "ability",
  83: "s",
  87: "w",
};
const OPPOSITE = {
  w: ["s", "arrowdown"],
  arrowup: ["s", "arrowdown"],
  s: ["w", "arrowup"],
  arrowdown: ["w", "arrowup"],
  a: ["d", "arrowright"],
  arrowleft: ["d", "arrowright"],
  d: ["a", "arrowleft"],
  arrowright: ["a", "arrowleft"],
};
function keyName(event) {
  return (
    DIRECTIONS[event.code] ||
    ([
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "shift",
      "e",
      "q",
      " ",
    ].includes(event.key?.toLowerCase())
      ? event.key.toLowerCase()
      : null) ||
    {
      Up: "arrowup",
      Down: "arrowdown",
      Left: "arrowleft",
      Right: "arrowright",
    }[event.key] ||
    LEGACY_KEYS[event.keyCode || event.which]
  );
}
// Keep physical input state independently of rendering and OS auto-repeat frequency.
// Normal held keys release immediately. Automatic buffering catches the very
// short press/release packets used by remote connections so a frame cannot miss them.
export function createKeyboardInput(
  keys,
  {
    enabled,
    onChange,
    onInteract,
    onAbility,
    onPress,
    onStop,
    target = window,
    releaseDelay = 0,
    buffered = true,
    trace = false,
  },
) {
  const actionKeys = new Set();
  const presses = new Map();
  const releases = new Map();
  // Optional, movement-only diagnostics are kept in memory. Normal play does no
  // synchronous storage writes while processing a key or drawing a frame.
  const events = [];
  function record(type, event) {
    if (!trace) return;
    events.push({
      at: Math.round(performance.now()),
      type,
      key: event?.code || event?.key || "",
      repeat: !!event?.repeat,
      held: [...keys].join(","),
    });
    if (events.length > 96) events.shift();
  }
  function down(event) {
    const key = keyName(event);
    if (
      !key ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.target?.isContentEditable ||
      /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName) ||
      !enabled()
    )
      return;
    event.preventDefault();
    record("down", event);
    if (key === "stop" || key === " ") {
      onStop?.();
      return;
    }
    if (key === "ability" || key === "q") {
      // Track the physical press ourselves. Some forwarded keyboards mark
      // the first Q event as repeat while another movement key is held.
      if (!actionKeys.has("ability")) {
        actionKeys.add("ability");
        onAbility?.();
      }
      return;
    }
    if (key === "e") {
      if (!actionKeys.has("interact")) {
        actionKeys.add("interact");
        onInteract();
      }
      return;
    }
    // A new opposite direction cancels only a released packet's tail, never a
    // genuinely held second key. Turning around should not fight buffered motion.
    for (const other of OPPOSITE[key] || [])
      if (presses.get(other)?.up !== undefined) {
        clearTimeout(releases.get(other));
        releases.delete(other);
        presses.delete(other);
        keys.delete(other);
      }
    const now = performance.now(),
      previous = presses.get(key);
    // The app panel forwards held letters as 0–5 ms taps, separated by ~80 ms, with
    // a ~500 ms startup repeat delay. Preserve intent across those packets. Real held
    // keyboard events retain their usual prompt key-up behavior.
    if (!previous || previous.up !== undefined) {
      presses.set(key, {
        down: now,
        interval: previous ? now - previous.down : Infinity,
        continued: keys.has(key),
        confirmed: keys.has(key) && !!(previous?.pulse || previous?.confirmed),
      });
    }
    clearTimeout(releases.get(key));
    releases.delete(key);
    // Repeat can restore a held key after focus/visibility changes, but never schedules
    // duplicate render loops when the key is already present.
    if (!keys.has(key)) {
      keys.add(key);
      onPress?.(event.code || key);
      onChange(true);
    }
  }
  function up(event) {
    const key = keyName(event);
    if (key === "ability" || key === "q") {
      actionKeys.delete("ability");
      return;
    }
    if (key === "e") {
      actionKeys.delete("interact");
      return;
    }
    if (!key || !keys.has(key)) return;
    record("up", event);
    event.preventDefault();
    const press = presses.get(key),
      now = performance.now();
    if (!buffered || !press || now - press.down > 10) {
      clearTimeout(releases.get(key));
      releases.delete(key);
      presses.delete(key);
      keys.delete(key);
      record("released", event);
      onChange(false);
      return;
    }
    const pulse = now - press.down <= 10;
    if (press) {
      press.up = now;
      press.pulse = pulse;
    }
    const delay = pulse ? (press.confirmed ? 120 : 560) : releaseDelay;
    const latest = events[events.length - 1];
    if (latest) {
      latest.releaseDelay = delay;
      latest.packet = pulse ? "tap-packet" : "held-key";
    }
    clearTimeout(releases.get(key));
    releases.set(
      key,
      setTimeout(() => {
        releases.delete(key);
        keys.delete(key);
        record("released", event);
        onChange(false);
      }, delay),
    );
  }
  target.addEventListener("keydown", down, true);
  target.addEventListener("keyup", up, true);
  return {
    statistics: () => events,
    setBuffered(value) {
      buffered = !!value;
      this.clear("keyboard-mode-change");
    },
    isActive(key) {
      return keys.has(key);
    },
    strength(key) {
      if (!keys.has(key)) return 0;
      if (!buffered) return 1;
      const press = presses.get(key);
      if (!press?.pulse || press.confirmed) return 1;
      // The first app-panel packet cannot reveal whether the physical key is still held.
      // A gentle tail bridges its repeat delay, bounded to roughly one small step per tap.
      return (
        0.1 + 0.9 * Math.exp(-Math.max(0, performance.now() - press.down) / 60)
      );
    },
    clear(reason = "stop") {
      record(reason);
      releases.forEach(clearTimeout);
      releases.clear();
      presses.clear();
      actionKeys.clear();
      keys.clear();
    },
    dispose() {
      this.clear();
      target.removeEventListener("keydown", down, true);
      target.removeEventListener("keyup", up, true);
    },
  };
}
