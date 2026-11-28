import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { DesktopPortfolio } from "./DesktopPortfolio";
import { games } from "../data/games";
jest.mock("../pages/ResumePage", () => () => null);
jest.mock("../components/Projects", () => ({ Projects: () => null }));
jest.mock("../components/Contact", () => ({ Contact: () => null }));
jest.mock("../typing/TypingTest", () => () => null);
jest.mock("../ascii/AsciiStudio", () => ({ active }) => (
  <div data-ascii-active={String(active)}>ASCII terminal</div>
));
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.removeItem("masyn-mac-appearance");
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
  act(() => host.querySelector('[aria-label="Open Profile"]').click());
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

test("ASCII opens from the dock and suspends while minimized or another app is in front", () => {
  const dock = host.querySelector('[aria-label="Open ASCII"]');
  act(() => dock.click());
  const bloom = host.querySelector('[role="dialog"][aria-label="ASCII"]');
  expect(bloom.textContent).toContain("ASCII terminal");
  expect(bloom.querySelector('[data-ascii-active="true"]')).not.toBeNull();
  act(() => host.querySelector('[aria-label="Open Skills"]').click());
  expect(bloom.querySelector('[data-ascii-active="false"]')).not.toBeNull();
  act(() => dock.click());
  expect(
    host.querySelectorAll('[role="dialog"][aria-label="ASCII"]'),
  ).toHaveLength(1);
  act(() => bloom.querySelector('[aria-label="Minimize ASCII"]').click());
  expect(bloom.hidden).toBe(true);
  expect(bloom.querySelector('[data-ascii-active="false"]')).not.toBeNull();
  act(() => dock.click());
  expect(bloom.hidden).toBe(false);
  act(() => bloom.querySelector('[aria-label="Close ASCII"]').click());
  expect(host.querySelector('[role="dialog"][aria-label="ASCII"]')).toBeNull();
  expect(document.activeElement).toBe(dock);
});

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
  act(() => dialog.querySelector('[aria-label="Maximize Profile"]').click());
  titlebar.setPointerCapture.mockClear();
  pointer(titlebar, "pointerdown", 130, 90);
  expect(titlebar.setPointerCapture).not.toHaveBeenCalled();
  act(() => dialog.querySelector('[aria-label="Restore Profile"]').click());
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
  const cartridges = library.querySelectorAll(
    ".game-library-category:last-child .game-cartridge",
  );
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

test("workspace switches Mac, Windows and Ubuntu without closing apps and keeps its choice", () => {
  act(() => host.querySelector('[aria-label="Open Profile"]').click());
  expect(host.textContent).toContain("Masyn Nay");
  expect(host.textContent).not.toContain("Hey, I’m Masyn");
  act(() => host.querySelector('[aria-label="Open system menu"]').click());
  act(() =>
    [...host.querySelectorAll('[role="menuitem"]')]
      .find((b) => b.textContent === "Customize Workspace…")
      .click(),
  );
  const chooseSystem = (system) =>
    act(() =>
      [...host.querySelectorAll(".workspace-os-picker button")]
        .find((b) => b.textContent === system)
        .click(),
    );
  for (const system of ["Windows", "Ubuntu", "Mac"]) {
    chooseSystem(system);
    expect(host.querySelector(".desktop-studio").dataset.system).toBe(
      system.toLowerCase(),
    );
    expect(
      host.querySelector('[role="dialog"][aria-label="Profile"]'),
    ).not.toBeNull();
    expect(
      JSON.parse(localStorage.getItem("masyn-mac-appearance")).system,
    ).toBe(system.toLowerCase());
  }
});

function chooseWorkspace(name) {
  act(() => host.querySelector('[aria-label="Open system menu"]').click());
  act(() =>
    [...host.querySelectorAll('[role="menuitem"]')]
      .find((b) => b.textContent === "Customize Workspace…")
      .click(),
  );
  act(() =>
    [...host.querySelectorAll(".workspace-os-picker button")]
      .find((b) => b.textContent === name)
      .click(),
  );
  act(() => host.querySelector('[aria-label="Close Appearance"]').click());
}

test("Windows Start opens pinned apps, searches and restores a minimized app from Task View", () => {
  chooseWorkspace("Windows");
  act(() => host.querySelector('[aria-label="Open Start"]').click());
  let panel = host.querySelector('[role="dialog"][aria-label="Start"]');
  expect(panel.querySelectorAll(".workspace-launch-grid button")).toHaveLength(
    9,
  );
  const all = [...panel.querySelectorAll("button")].find(
    (b) => b.textContent === "All Apps",
  );
  act(() => all.click());
  expect(panel.querySelector(".workspace-launch-heading h3").textContent).toBe(
    "All Apps",
  );
  const input = panel.querySelector("input");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(input, "Typing");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(panel.querySelectorAll(".workspace-launch-grid button")).toHaveLength(
    1,
  );
  act(() => panel.querySelector(".workspace-launch-grid button").click());
  const app = host.querySelector('[role="dialog"][aria-label="Typing Test"]');
  expect(app).not.toBeNull();
  act(() => app.querySelector('[aria-label="Minimize Typing Test"]').click());
  expect(app.hidden).toBe(true);
  act(() => host.querySelector('[aria-label="Task View"]').click());
  panel = host.querySelector('[role="dialog"][aria-label="Window Overview"]');
  expect(panel.textContent).toContain("Minimized");
  act(() => panel.querySelector(".workspace-running-grid button").click());
  expect(app.hidden).toBe(false);
});

test("Ubuntu Activities leads to the application grid and settings persist without replacing the desktop apps", () => {
  chooseWorkspace("Ubuntu");
  act(() => host.querySelector('[aria-label="Open Activities"]').click());
  const overview = host.querySelector(
    '[role="dialog"][aria-label="Activities"]',
  );
  act(() =>
    [...overview.querySelectorAll("button")]
      .find((b) => b.textContent === "Show Applications")
      .click(),
  );
  expect(
    host.querySelector('[role="dialog"][aria-label="Applications"]'),
  ).not.toBeNull();
  act(() => host.querySelector('[aria-label="Close Applications"]').click());
  act(() => host.querySelector('[aria-label="Quick Settings"]').click());
  const settings = host.querySelector(
    '[role="dialog"][aria-label="Quick Settings"]',
  );
  act(() =>
    [...settings.querySelectorAll("button")]
      .find((b) => b.textContent.includes("Wallpaper Motion"))
      .click(),
  );
  expect(host.querySelector(".desktop-studio").dataset.motion).toBe("false");
  act(() =>
    [...settings.querySelectorAll("button")]
      .find((b) => b.textContent.includes("Desktop Widgets"))
      .click(),
  );
  expect(host.querySelector(".workspace-widgets")).not.toBeNull();
  act(() =>
    [...settings.querySelectorAll("button")]
      .find((b) => b.textContent.includes("Desktop Widgets"))
      .click(),
  );
  expect(host.querySelector(".workspace-widgets")).toBeNull();
  expect(JSON.parse(localStorage.getItem("masyn-mac-appearance")).widgets).toBe(
    false,
  );
});

test("each workspace has its own text-free default wallpaper and remembers a custom choice", () => {
  const studio = () => host.querySelector(".desktop-studio");
  expect(host.querySelector(".desktop-wallpaper").textContent).toBe("");
  expect(host.querySelector(".desktop-empty")).toBeNull();
  expect(host.querySelector(".workspace-widgets")).toBeNull();
  expect(host.querySelector("#mac-sky")).not.toBeNull();
  act(() => host.querySelector('[aria-label="Open system menu"]').click());
  act(() =>
    [...host.querySelectorAll('[role="menuitem"]')]
      .find((b) => b.textContent === "Customize Workspace…")
      .click(),
  );
  const system = (name) =>
    act(() =>
      [...host.querySelectorAll(".workspace-os-picker button")]
        .find((b) => b.textContent === name)
        .click(),
    );
  const wallpaper = (name) =>
    act(() =>
      host.querySelector(`input[name="wallpaper"][value="${name}"]`).click(),
    );
  wallpaper("forest");
  system("Windows");
  expect(studio().dataset.wallpaper).toBe("ocean");
  expect(host.querySelector("#win-fold")).not.toBeNull();
  wallpaper("midnight");
  system("Ubuntu");
  expect(studio().dataset.wallpaper).toBe("ocean");
  expect(host.querySelector("#ubuntu-sky")).not.toBeNull();
  wallpaper("ember");
  system("Mac");
  expect(studio().dataset.wallpaper).toBe("forest");
  system("Windows");
  expect(studio().dataset.wallpaper).toBe("midnight");
  system("Ubuntu");
  expect(studio().dataset.wallpaper).toBe("ember");
  expect(
    JSON.parse(localStorage.getItem("masyn-mac-appearance")).wallpaperBySystem,
  ).toEqual({ mac: "forest", windows: "midnight", ubuntu: "ember" });
});

test("Mac Spotlight and calendar have independent working controls", () => {
  act(() => host.querySelector('[aria-label="Spotlight Search"]').click());
  const spotlight = host.querySelector(
    '[role="dialog"][aria-label="Spotlight"]',
  );
  act(() =>
    [...spotlight.querySelectorAll(".workspace-launch-grid button")]
      .find((b) => b.textContent === "ASCII")
      .click(),
  );
  expect(
    host.querySelector('[role="dialog"][aria-label="ASCII"]'),
  ).not.toBeNull();
  act(() => host.querySelector('[aria-label="Open Calendar"]').click());
  const calendar = host.querySelector('[role="dialog"][aria-label="Calendar"]');
  const heading = calendar.querySelector(".workspace-calendar-heading strong");
  const initial = heading.textContent;
  act(() => calendar.querySelector('[aria-label="Next month"]').click());
  expect(heading.textContent).not.toBe(initial);
  act(() => calendar.querySelector(".workspace-calendar-today").click());
  expect(heading.textContent).toBe(initial);
  expect(calendar.querySelectorAll('[data-today="true"]')).toHaveLength(1);
});
