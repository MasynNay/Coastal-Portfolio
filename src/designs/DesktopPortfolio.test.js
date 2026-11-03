import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { DesktopPortfolio } from "./DesktopPortfolio";
import { games } from "../data/games";
jest.mock("../pages/ResumePage", () => () => null);
jest.mock("../components/Projects", () => ({ Projects: () => null }));
jest.mock("../components/Contact", () => ({ Contact: () => null }));
jest.mock("../typing/TypingTest", () => () => null);
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DesktopPortfolio />
      </MemoryRouter>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
  jest.restoreAllMocks();
});

// jsdom does not lay out CSS or implement pointer capture. Supply measured
// phone-sized bounds, then exercise the real title-bar event handlers.
function mobileWindow() {
  act(() => host.querySelector('[aria-label="Open About Masyn"]').click());
  const dialog = host.querySelector('[role="dialog"]');
  const titlebar = dialog.querySelector('[role="toolbar"]');
  const area = dialog.parentElement;
  const layout = {
    width: 390,
    height: 620,
    windowWidth: 330,
    windowHeight: 360,
  };
  jest.spyOn(area, "getBoundingClientRect").mockImplementation(() => ({
    left: 20,
    top: 60,
    width: layout.width,
    height: layout.height,
    right: 20 + layout.width,
    bottom: 60 + layout.height,
  }));
  jest.spyOn(dialog, "getBoundingClientRect").mockImplementation(() => ({
    left: 20 + (parseFloat(dialog.style.getPropertyValue("--window-x")) || 16),
    top: 60 + (parseFloat(dialog.style.getPropertyValue("--window-y")) || 18),
    width: layout.windowWidth,
    height: layout.windowHeight,
  }));
  jest
    .spyOn(host.querySelector(".desktop-dock"), "getBoundingClientRect")
    .mockImplementation(() => ({ top: 60 + layout.height - 76 }));
  titlebar.setPointerCapture = jest.fn();
  titlebar.hasPointerCapture = jest.fn(() => true);
  titlebar.releasePointerCapture = jest.fn();
  const point = () => ({
    x: parseFloat(dialog.style.getPropertyValue("--window-x")),
    y: parseFloat(dialog.style.getPropertyValue("--window-y")),
  });
  return { dialog, titlebar, layout, point };
}

function pointer(node, type, x, y, extra = {}) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  Object.defineProperties(event, {
    pointerId: { value: extra.pointerId ?? 7 },
    pointerType: { value: "touch" },
    isPrimary: { value: extra.isPrimary ?? true },
  });
  act(() => node.dispatchEvent(event));
  return event;
}

test("a finger drags from the actual mobile position, ignores other fingers, and stops on release", () => {
  const { dialog, titlebar, point } = mobileWindow();
  pointer(titlebar, "pointerdown", 130, 90);
  expect(titlebar.setPointerCapture).toHaveBeenCalledWith(7);
  expect(dialog.classList.contains("window-dragging")).toBe(true);
  pointer(titlebar, "pointerdown", 140, 100, {
    pointerId: 8,
    isPrimary: false,
  });
  pointer(titlebar, "pointermove", 180, 150, { pointerId: 8 });
  expect(Number.isNaN(point().x)).toBe(true);
  pointer(titlebar, "pointermove", 180, 150);
  expect(point()).toEqual({ x: 52, y: 78 });
  pointer(titlebar, "pointerup", 180, 150);
  expect(titlebar.releasePointerCapture).toHaveBeenCalledWith(7);
  expect(dialog.classList.contains("window-dragging")).toBe(false);
  pointer(titlebar, "pointermove", 100, 200);
  expect(point()).toEqual({ x: 52, y: 78 });
});

test("rotation recontains the window above the dock; app scrolling, controls and maximization do not start drags", () => {
  const { dialog, titlebar, layout, point } = mobileWindow();
  const body = dialog.querySelector(".desktop-window-body");
  expect(pointer(body, "pointerdown", 150, 200).defaultPrevented).toBe(false);
  pointer(dialog.querySelector("button"), "pointerdown", 50, 90);
  expect(titlebar.setPointerCapture).not.toHaveBeenCalled();
  pointer(titlebar, "pointerdown", 130, 90);
  pointer(titlebar, "pointermove", 1000, 1000);
  expect(point()).toEqual({ x: 52, y: 168 });
  pointer(titlebar, "pointercancel", 1000, 1000);
  expect(dialog.classList.contains("window-dragging")).toBe(false);
  layout.width = 320;
  layout.height = 480;
  layout.windowWidth = 270;
  act(() => window.dispatchEvent(new Event("resize")));
  expect(point()).toEqual({ x: 42, y: 28 });
  act(() =>
    dialog.querySelector('[aria-label="Maximize About Masyn"]').click(),
  );
  titlebar.setPointerCapture.mockClear();
  pointer(titlebar, "pointerdown", 130, 90);
  expect(titlebar.setPointerCapture).not.toHaveBeenCalled();
  act(() => dialog.querySelector('[aria-label="Restore About Masyn"]').click());
  expect(point()).toEqual({ x: 42, y: 28 });
  act(() =>
    titlebar.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    ),
  );
  expect(point()).toEqual({ x: 26, y: 28 });
});

test("grabbing a background window raises it without moving its captured DOM node", () => {
  const { dialog, titlebar } = mobileWindow();
  act(() => host.querySelector('[aria-label="Open Skills"]').click());
  const skills = host.querySelector('[role="dialog"][aria-label="Skills"]');
  const originalOrder = [...host.querySelectorAll('[role="dialog"]')];
  pointer(titlebar, "pointerdown", 130, 90);
  expect([...host.querySelectorAll('[role="dialog"]')]).toEqual(originalOrder);
  expect(Number(dialog.style.zIndex)).toBeGreaterThan(
    Number(skills.style.zIndex),
  );
  pointer(titlebar, "pointermove", 140, 120);
  expect(dialog.style.getPropertyValue("--window-y")).toBe("48px");
});
test("cartridges open separate game windows; reopening restores one window and closing unloads the player", () => {
  const dock = host.querySelector('[aria-label="Open Games"]');
  act(() => dock.click());
  const library = host.querySelector('[role="dialog"][aria-label="Games"]');
  expect(library.querySelector("iframe")).toBeNull();
  const cartridges = library.querySelectorAll(".game-cartridge");
  act(() => cartridges[0].click());
  const player = host.querySelector(
    `[role="dialog"][aria-label="${games[0].name}"]`,
  );
  expect(player.querySelector("iframe").src).toBe(
    new URL(`${games[0].url}&view=mac`, window.location.href).href,
  );
  expect(player.textContent).toContain("Take the controls");
  act(() => cartridges[0].click());
  expect(
    host.querySelectorAll(`[role="dialog"][aria-label="${games[0].name}"]`),
  ).toHaveLength(1);
  act(() => cartridges[1].click());
  expect(host.querySelectorAll("iframe")).toHaveLength(2);
  act(() =>
    player.querySelector(`[aria-label="Close ${games[0].name}"]`).click(),
  );
  expect(host.querySelectorAll("iframe")).toHaveLength(1);
  expect(document.activeElement).toBe(dock);
});

test.each(["Element Runner", "Axolotl Drift"])(
  "%s opens maximized with its controls collapsed and can be restored",
  (title) => {
    act(() => host.querySelector('[aria-label="Open Games"]').click());
    act(() => host.querySelector(`[aria-label="Play ${title}"]`).click());
    const player = host.querySelector(`[role="dialog"][aria-label="${title}"]`);
    expect(player.classList.contains("window-maximized")).toBe(true);
    expect(player.querySelector("iframe").src).toContain("?view=mac");
    expect(player.querySelector(".mac-controls").hidden).toBe(true);
    expect(
      player.querySelector('[aria-label="Play fullscreen"]'),
    ).not.toBeNull();
    act(() => player.querySelector(`[aria-label="Restore ${title}"]`).click());
    expect(player.classList.contains("window-maximized")).toBe(false);
  },
);
