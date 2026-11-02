import { createKeyboardInput } from "./keyboardInput";
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("physical key codes work independently of keyboard text layout", () => {
  const keys = new Set(),
    change = jest.fn(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      buffered: true,
      onChange: change,
      onInteract: () => {},
    });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyW",
      key: "z",
    }),
  );
  expect(keys.has("w")).toBe(true);
  input.dispose();
});
test("OS auto-repeat release/press pairs do not interrupt a held key", () => {
  const keys = new Set(),
    change = jest.fn(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      buffered: true,
      onChange: change,
      onInteract: () => {},
    });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyD",
      key: "d",
    }),
  );
  for (let i = 0; i < 10; i++) {
    window.dispatchEvent(
      new KeyboardEvent("keyup", {
        code: "KeyD",
        key: "d",
      }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "KeyD",
        key: "d",
        repeat: true,
      }),
    );
    jest.advanceTimersByTime(5);
  }
  expect(keys.has("d")).toBe(true);
  expect(change).toHaveBeenCalledTimes(1);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyD",
      key: "d",
    }),
  );
  jest.advanceTimersByTime(151);
  expect(keys.size).toBe(0);
  input.dispose();
});
test("a repeated key can restore input after focus cleanup", () => {
  const keys = new Set(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      buffered: true,
      onChange: () => {},
      onInteract: () => {},
    });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "w",
    }),
  );
  input.clear();
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "w",
      repeat: true,
    }),
  );
  expect(keys.has("w")).toBe(true);
  input.dispose();
});
test("captured app-panel tap packets keep movement continuous across startup and repeats", () => {
  const keys = new Set(),
    change = jest.fn(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      buffered: true,
      onChange: change,
      onInteract: () => {},
    });
  const packet = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "KeyW",
        key: "w",
        repeat: false,
      }),
    );
    jest.advanceTimersByTime(5);
    window.dispatchEvent(
      new KeyboardEvent("keyup", {
        code: "KeyW",
        key: "w",
        repeat: false,
      }),
    );
  };
  packet();
  jest.advanceTimersByTime(499);
  expect(keys.has("w")).toBe(true);
  packet();
  for (let i = 0; i < 28; i++) {
    jest.advanceTimersByTime(78);
    expect(keys.has("w")).toBe(true);
    packet();
  }
  expect(change.mock.calls.filter(([start]) => start)).toHaveLength(1);
  jest.advanceTimersByTime(151);
  expect(keys.size).toBe(0);
  input.dispose();
});
test("a real held key still releases promptly and Space clears buffered movement", () => {
  const keys = new Set();
  let input;
  input = createKeyboardInput(keys, {
    enabled: () => true,
    buffered: true,
    onChange: () => {},
    onInteract: () => {},
    onStop: () => input.clear(),
  });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyD",
      key: "d",
    }),
  );
  jest.advanceTimersByTime(800);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyD",
      key: "d",
    }),
  );
  jest.advanceTimersByTime(13);
  expect(keys.size).toBe(0);
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyW",
      key: "w",
    }),
  );
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyW",
      key: "w",
    }),
  );
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "Space",
      key: " ",
    }),
  );
  expect(keys.size).toBe(0);
  input.dispose();
});
test("a single app tap has a gentle movement tail until repeats confirm continuous motion", () => {
  const keys = new Set(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      buffered: true,
      onChange: () => {},
      onInteract: () => {},
    });
  const packet = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "w",
        code: "KeyW",
      }),
    );
    jest.advanceTimersByTime(2);
    window.dispatchEvent(
      new KeyboardEvent("keyup", {
        key: "w",
        code: "KeyW",
      }),
    );
  };
  packet();
  expect(input.isActive("w")).toBe(true);
  jest.advanceTimersByTime(31);
  expect(input.isActive("w")).toBe(true);
  expect(input.strength("w")).toBeGreaterThan(0);
  jest.advanceTimersByTime(470);
  expect(input.strength("w")).toBeCloseTo(0.1, 2);
  packet();
  expect(input.isActive("w")).toBe(true);
  for (let i = 0; i < 20; i++) {
    jest.advanceTimersByTime(82);
    packet();
    expect(input.isActive("w")).toBe(true);
  }
  jest.advanceTimersByTime(121);
  expect(input.isActive("w")).toBe(false);
  input.dispose();
});
test("the first app packet never drops to zero before repeat confirmation, and a tap stays small", () => {
  const keys = new Set(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      buffered: true,
      onChange: () => {},
      onInteract: () => {},
    });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyD",
      key: "d",
    }),
  );
  jest.advanceTimersByTime(2);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyD",
      key: "d",
    }),
  );
  let distance = 0;
  for (let i = 0; i < 69; i++) {
    jest.advanceTimersByTime(8);
    const strength = input.strength("d");
    expect(strength).toBeGreaterThan(0);
    distance += strength * 8.5 * 0.008;
  }
  expect(distance).toBeLessThan(1.1);
  jest.advanceTimersByTime(20);
  expect(input.strength("d")).toBe(0);
  input.dispose();
});
test("two held directions remain independent for diagonal walking and release separately", () => {
  const keys = new Set(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      buffered: true,
      onChange: () => {},
      onInteract: () => {},
    });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyW",
      key: "w",
    }),
  );
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyD",
      key: "d",
    }),
  );
  jest.advanceTimersByTime(800);
  expect(input.strength("w")).toBe(1);
  expect(input.strength("d")).toBe(1);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyW",
      key: "w",
    }),
  );
  jest.advanceTimersByTime(13);
  expect(input.strength("w")).toBe(0);
  expect(input.strength("d")).toBe(1);
  input.dispose();
});
test("direct input stops immediately, including a short tap, and preserves the other diagonal axis", () => {
  const keys = new Set();
  const input = createKeyboardInput(keys, {
    enabled: () => true,
    buffered: false,
    onChange: () => {},
    onInteract: () => {},
  });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyW",
      key: "w",
    }),
  );
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyD",
      key: "d",
    }),
  );
  expect(input.strength("w")).toBe(1);
  expect(input.strength("d")).toBe(1);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyW",
      key: "w",
    }),
  );
  expect(input.strength("w")).toBe(0);
  expect(input.strength("d")).toBe(1);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyD",
      key: "d",
    }),
  );
  expect(keys.size).toBe(0);
  jest.advanceTimersByTime(600);
  expect(keys.size).toBe(0);
  input.dispose();
});
test("legacy remote key names and key codes still support arrows and WASD", () => {
  const keys = new Set(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      onChange: () => {},
      onInteract: () => {},
    });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Up",
    }),
  );
  expect(input.strength("arrowup")).toBe(1);
  input.clear();
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      keyCode: 87,
    }),
  );
  expect(input.strength("w")).toBe(1);
  input.dispose();
});
test("turning around cancels a released remote pulse without cancelling diagonal holds", () => {
  const keys = new Set(),
    input = createKeyboardInput(keys, {
      enabled: () => true,
      onChange: () => {},
      onInteract: () => {},
    });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyW",
      key: "w",
    }),
  );
  jest.advanceTimersByTime(2);
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code: "KeyW",
      key: "w",
    }),
  );
  jest.advanceTimersByTime(30);
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyS",
      key: "s",
    }),
  );
  expect(input.strength("w")).toBe(0);
  expect(input.strength("s")).toBe(1);
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "KeyD",
      key: "d",
    }),
  );
  expect(input.strength("s")).toBe(1);
  expect(input.strength("d")).toBe(1);
  input.dispose();
});
test("Q triggers one ability without becoming a movement key or repeating while held", () => {
  const keys = new Set(),
    ability = jest.fn();
  const input = createKeyboardInput(keys, {
    enabled: () => true,
    onChange: () => {},
    onInteract: () => {},
    onAbility: ability,
  });
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "q",
      code: "KeyQ",
    }),
  );
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "q",
      code: "KeyQ",
      repeat: true,
    }),
  );
  expect(ability).toHaveBeenCalledTimes(1);
  expect(keys.size).toBe(0);
  input.dispose();
});

test("Q remains available during held movement even when its first event is flagged as repeat", () => {
  const keys = new Set(),
    ability = jest.fn();
  const input = createKeyboardInput(keys, {
    enabled: () => true,
    buffered: false,
    onChange: () => {},
    onInteract: () => {},
    onAbility: ability,
  });
  window.dispatchEvent(
    new KeyboardEvent("keydown", { code: "KeyW", key: "w" }),
  );
  window.dispatchEvent(
    new KeyboardEvent("keydown", { code: "KeyQ", key: "q", repeat: true }),
  );
  expect(ability).toHaveBeenCalledTimes(1);
  expect(keys.has("w")).toBe(true);
  window.dispatchEvent(
    new KeyboardEvent("keydown", { code: "KeyQ", key: "q", repeat: true }),
  );
  expect(ability).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyQ", key: "q" }));
  expect(keys.has("w")).toBe(true);
  window.dispatchEvent(
    new KeyboardEvent("keydown", { code: "KeyQ", key: "q" }),
  );
  expect(ability).toHaveBeenCalledTimes(2);
  input.dispose();
});
