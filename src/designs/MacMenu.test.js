import { act, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { MacMenu, AboutMac } from "./MacMenu";

let host, root;
function Mac() {
  const trigger = useRef(null),
    [about, setAbout] = useState(false);
  return (
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <MacMenu buttonRef={trigger} onAbout={() => setAbout(true)} />
      {about && (
        <AboutMac returnFocusRef={trigger} onClose={() => setAbout(false)} />
      )}
    </MemoryRouter>
  );
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<Mac />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
function key(name) {
  act(() =>
    document.activeElement.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: name,
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
}
test("the system menu supports arrows, Escape and normal Tab dismissal", () => {
  const trigger = host.querySelector("button");
  act(() => trigger.click());
  const items = host.querySelectorAll('[role="menuitem"]');
  expect(document.activeElement).toBe(items[0]);
  key("ArrowDown");
  expect(document.activeElement).toBe(items[1]);
  key("End");
  expect(document.activeElement).toBe(items[2]);
  key("Escape");
  expect(document.activeElement).toBe(trigger);
  expect(host.querySelector('[role="menu"]')).toBe(null);
  act(() => trigger.click());
  key("Tab");
  expect(host.querySelector('[role="menu"]')).toBe(null);
  expect(document.activeElement).toBe(trigger);
});
test("About this Mac opens as a modal and returns focus to the system trigger when closed", () => {
  const trigger = host.querySelector("button");
  act(() => trigger.click());
  act(() => host.querySelector('[role="menuitem"]').click());
  expect(host.querySelector('[role="menu"]')).toBe(null);
  const dialog = host.querySelector('[role="dialog"]');
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  expect(document.activeElement).toBe(dialog);
  expect(dialog.textContent).toContain("MN-MTNDEW-REPEAT");
  key("Tab");
  expect(document.activeElement.getAttribute("aria-label")).toBe(
    "Close About this Mac",
  );
  key("Escape");
  expect(host.querySelector('[role="dialog"]')).toBe(null);
  expect(document.activeElement).toBe(trigger);
});
