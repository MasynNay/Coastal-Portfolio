import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { NavBar } from "./NavBar";

let host, root, originalMedia, target;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  originalMedia = window.matchMedia;
  window.matchMedia = () => ({ matches: true });
  host = document.createElement("div");
  target = document.createElement("section");
  target.id = "skills";
  target.scrollIntoView = jest.fn();
  document.body.append(host, target);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  target.remove();
  window.matchMedia = originalMedia;
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
function show(path) {
  act(() =>
    root.render(
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NavBar glass />
      </MemoryRouter>,
    ),
  );
}
test("collapsed navigation closes after choosing a section and respects reduced motion", () => {
  show("/design/glass");
  expect(host.querySelector('a[href="/services"]')).toBeNull();
  const toggle = host.querySelector(".navbar-toggler");
  expect(toggle.getAttribute("aria-label")).toBe("Toggle navigation");
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  const skills = host.querySelector('a[href="/design/glass#skills"]');
  act(() => skills.click());
  act(() => jest.runOnlyPendingTimers());
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(skills.getAttribute("aria-current")).toBe("location");
  expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
  expect(
    [...host.querySelectorAll(".glass-mac-button")].map((a) =>
      a.getAttribute("href"),
    ),
  ).toEqual(["/design/desktop", "/world"]);
});
test("the resume page announces its active page and keeps working navigation to Home", () => {
  show("/design/glass/resume");
  const links = host.querySelectorAll(".navbar-nav a");
  expect([...links].map((a) => a.textContent)).toEqual(["Home", "Resume"]);
  expect(links[0].getAttribute("href")).toBe("/design/glass");
  expect(links[1].getAttribute("aria-current")).toBe("page");
});

test("Game Mode has a visible mobile-menu label after Mac Mode and closes navigation on selection", () => {
  show("/design/glass");
  const toggle = host.querySelector(".navbar-toggler");
  act(() => toggle.click());
  const modes = host.querySelectorAll(".glass-mac-button");
  expect([...modes].map((link) => link.textContent.trim())).toEqual([
    "Mac Mode",
    "Game Mode",
  ]);
  expect(modes[1].getAttribute("href")).toBe("/world");
  expect(modes[1].getAttribute("aria-label")).toBe("Explore game mode");
  act(() => modes[1].click());
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});
