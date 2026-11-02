import { act } from "react";
import { createRoot } from "react-dom/client";
import TileGame from "./TileGame";
import OrcGame from "./OrcGame";
import GemGame from "./GemGame";
import { newTiles } from "./Tiles";
import { swapGems } from "./Gems";
import MemoryGame from "./MemoryGame";
import { gameTitles } from "./GameLocations";
jest.mock("../SpritePose", () => () => null);
jest.mock("./Tiles", () => ({
  ...jest.requireActual("./Tiles"),
  newTiles: jest.fn(() => [2, 2, 0, 0, ...Array(12).fill(0)]),
}));
let host, root;
beforeEach(() => {
  newTiles.mockImplementation(() => [2, 2, 0, 0, ...Array(12).fill(0)]);
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
function pointer(node, type, x, y, pointerType) {
  const e = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  Object.defineProperties(e, {
    pointerId: { value: 1 },
    pointerType: { value: pointerType },
  });
  act(() => node.dispatchEvent(e));
}
test.each(["mouse", "touch"])(
  "2048 %s drags move the entire board once; canceled gestures do not move it",
  (pointerType) => {
    act(() => root.render(<TileGame />));
    const board = host.querySelector(".number-board");
    pointer(board, "pointerdown", 200, 100, pointerType);
    pointer(board, "pointermove", 100, 100, pointerType);
    pointer(board, "pointercancel", 100, 100, pointerType);
    expect(host.textContent).toContain("Score 0");
    pointer(board, "pointerdown", 200, 100, pointerType);
    pointer(board, "pointermove", 100, 100, pointerType);
    pointer(board, "pointerup", 100, 100, pointerType);
    expect(host.textContent).toContain("Score 4");
    expect(board.firstChild.textContent).toBe("4");
  },
);
test("Orc Hunt targets are tappable buttons and score each successful hit", () => {
  act(() => root.render(<OrcGame />));
  act(() => host.querySelector("button").click());
  const targets = host.querySelectorAll(".orc-hunt-target");
  expect(targets.length).toBeGreaterThanOrEqual(3);
  expect(targets.length).toBeLessThanOrEqual(5);
  act(() => targets[0].click());
  expect(host.textContent).toContain("100 points");
  expect(host.querySelectorAll(".orc-hunt-target").length).toBe(targets.length);
  expect(targets[0].getAttribute("aria-disabled")).toBe("true");
  expect(gameTitles.chimes).toBe("Element Runner");
  expect(gameTitles.workbench).toBe("Orc Hunt");
});
test("memory cards reveal on a tap and count a pair of selections as one turn", () => {
  act(() => root.render(<MemoryGame />));
  const cards = host.querySelectorAll(".memory-card");
  act(() => cards[0].click());
  expect(cards[0].dataset.revealed).toBe("true");
  act(() => cards[1].click());
  expect(cards[1].dataset.revealed).toBe("true");
  expect(host.textContent).toMatch(/1 turn/);
});

test("2048 presents a game-over panel and restarts with the sail button", () => {
  newTiles.mockReturnValueOnce(
    Array.from({ length: 16 }, (_, i) => 2 ** (i + 1)),
  );
  act(() => root.render(<TileGame />));
  expect(host.querySelector(".tiles-game-over").textContent).toContain(
    "Game over",
  );
  act(() => host.querySelector(".tiles-game-over button").click());
  expect(host.querySelector(".tiles-game-over")).toBeNull();
});
test("a Poké Ball swipe performs one adjacent swap and consumes only one turn", () => {
  act(() => root.render(<GemGame />));
  const cells = [...host.querySelectorAll(".gem-cell")],
    board = cells.map((c) => Number(c.dataset.gem));
  let pair;
  for (let i = 0; i < 64 && !pair; i++)
    for (const j of [i + 1, i + 8])
      if (j < 64 && swapGems(board, i, j)) {
        pair = [i, j];
        break;
      }
  expect(pair).toBeDefined();
  const [a, b] = pair,
    dx = b - a === 1 ? 50 : 0,
    dy = b - a === 8 ? 50 : 0;
  pointer(cells[a], "pointerdown", 100, 100, "touch");
  pointer(cells[a], "pointerup", 100 + dx, 100 + dy, "touch");
  expect(host.textContent).toContain("29 moves left");
  act(() => cells[a].click());
  expect(host.textContent).toContain("29 moves left");
});

test("a matching turn shows old balls clearing before gravity, and accepts no extra move during playback", () => {
  jest.useFakeTimers();
  act(() => root.render(<GemGame />));
  const cells = [...host.querySelectorAll(".gem-cell")],
    board = cells.map((c) => Number(c.dataset.gem));
  let pair;
  for (let i = 0; i < 64 && !pair; i++)
    for (const j of [i + 1, i + 8])
      if (j < 64 && swapGems(board, i, j)) {
        pair = [i, j];
        break;
      }
  const [a, b] = pair;
  act(() => {
    cells[a].click();
  });
  act(() => {
    cells[b].click();
  });
  const grid = host.querySelector(".gem-board");
  expect(grid.dataset.phase).toBe("swapping");
  expect(grid.getAttribute("aria-busy")).toBe("true");
  act(() => jest.advanceTimersByTime(190));
  expect(grid.dataset.phase).toBe("clearing");
  expect(
    host.querySelectorAll('[data-flash="true"]').length,
  ).toBeGreaterThanOrEqual(3);
  act(() => cells[0].click());
  expect(host.textContent).toContain("29 moves left");
  act(() => jest.runAllTimers());
  expect(grid.dataset.phase).toBe("idle");
  expect(grid.getAttribute("aria-busy")).toBe("false");
  expect(host.querySelectorAll('[data-flash="true"]')).toHaveLength(0);
  jest.useRealTimers();
});

test("Orc Hunt starts from its central card and includes larger waves", () => {
  jest.useFakeTimers();
  const random = jest.spyOn(Math, "random").mockReturnValue(0.95);
  act(() => root.render(<OrcGame />));
  act(() => host.querySelector('[aria-label="Start Orc Hunt"]').click());
  expect(host.querySelectorAll(".orc-hunt-target")).toHaveLength(5);
  random.mockReturnValue(0.4);
  act(() => jest.advanceTimersByTime(5000));
  expect(host.querySelectorAll(".orc-hunt-target")).toHaveLength(4);
  random.mockRestore();
  jest.useRealTimers();
});
