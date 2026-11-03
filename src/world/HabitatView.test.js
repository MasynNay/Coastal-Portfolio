import { act } from "react";
import { createRoot } from "react-dom/client";
import HabitatView from "./HabitatView";

let host, root;
beforeEach(() => {
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

test.each([false, true])(
  "release requires confirmation without triggering inspection (aquatic: %s)",
  (aquatic) => {
    const onRelease = jest.fn(),
      onInspect = jest.fn();
    act(() =>
      root.render(
        <HabitatView
          name="Pebble"
          aquatic={aquatic}
          inspecting={false}
          onInspect={onInspect}
          onRelease={onRelease}
        />,
      ),
    );
    const release = host.querySelector(".habitat-release");
    expect(release.textContent).toBe("Release One");
    expect(release.closest("button")).toBe(release);
    expect(release.parentElement.querySelector("button button")).toBeNull();
    act(() => release.click());
    let confirmation = document.querySelector(
      '[aria-label="Release into the wild?"]',
    );
    expect(confirmation).not.toBeNull();
    expect(confirmation.textContent).toContain("into the wild");
    expect(onRelease).not.toHaveBeenCalled();
    expect(onInspect).not.toHaveBeenCalled();
    act(() =>
      [...confirmation.querySelectorAll("button")]
        .find((b) => b.textContent === "Cancel")
        .click(),
    );
    expect(onRelease).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(release);
    act(() => release.click());
    confirmation = document.querySelector(
      '[aria-label="Release into the wild?"]',
    );
    act(() =>
      [...confirmation.querySelectorAll("button")]
        .find((b) => b.textContent === "Release One")
        .click(),
    );
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".release-confirmation")).toBeNull();
    expect(onInspect).not.toHaveBeenCalled();
  },
);
