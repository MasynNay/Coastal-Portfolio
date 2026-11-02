import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import useDialogFocus from "./useDialogFocus";

let host, root, opener;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  opener = document.createElement("button");
  document.body.append(opener, host);
  root = createRoot(host);
  opener.focus();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  opener.remove();
  document.body.style.overflow = "";
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
function Panel({ close, name = "panel", children }) {
  const panel = useRef(null);
  useDialogFocus(panel, close);
  return (
    <section ref={panel} data-panel={name} tabIndex={-1}>
      <button data-first={name}>First</button>
      <button disabled>Disabled</button>
      <div hidden>
        <button>Hidden</button>
      </div>
      <div style={{ display: "none" }}>
        <a href="/">Invisible</a>
      </div>
      <details>
        <summary>More</summary>
        <button>Collapsed</button>
      </details>
      <button data-last={name}>Last</button>
      {children}
    </section>
  );
}
function key(value, shiftKey = false) {
  const event = new KeyboardEvent("keydown", {
    key: value,
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  act(() => document.activeElement.dispatchEvent(event));
  return event;
}
test("Tab enters the panel, skips unavailable controls and wraps in both directions", () => {
  act(() => root.render(<Panel close={() => {}} />));
  expect(document.activeElement).toBe(host.querySelector("section"));
  expect(key("Tab").defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(host.querySelector("[data-first]"));
  key("Tab", true);
  expect(document.activeElement).toBe(host.querySelector("[data-last]"));
  key("Tab");
  expect(document.activeElement).toBe(host.querySelector("[data-first]"));
  act(() => opener.focus());
  expect(document.activeElement).toBe(host.querySelector("section"));
});
test("updates retain focus and use the latest close callback; closing restores the opener and scroll", () => {
  document.body.style.overflow = "scroll";
  const firstClose = jest.fn(),
    nextClose = jest.fn();
  act(() => root.render(<Panel close={firstClose} />));
  const last = host.querySelector("[data-last]");
  act(() => last.focus());
  act(() => root.render(<Panel close={nextClose} />));
  expect(document.activeElement).toBe(last);
  expect(document.body.style.overflow).toBe("hidden");
  key("Escape");
  expect(firstClose).not.toHaveBeenCalled();
  expect(nextClose).toHaveBeenCalledTimes(1);
  act(() => root.render(null));
  expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).toBe("scroll");
});
test("only the top modal handles Escape, and scroll stays locked until both close", () => {
  const lowerClose = jest.fn(),
    upperClose = jest.fn();
  act(() =>
    root.render(
      <>
        <Panel key="lower" close={lowerClose} />
      </>,
    ),
  );
  const lower = host.querySelector("[data-first]");
  act(() => lower.focus());
  act(() =>
    root.render(
      <>
        <Panel key="lower" close={lowerClose} />
        <Panel key="upper" name="upper" close={upperClose} />
      </>,
    ),
  );
  key("Escape");
  expect(upperClose).toHaveBeenCalledTimes(1);
  expect(lowerClose).not.toHaveBeenCalled();
  act(() =>
    root.render(
      <>
        <Panel key="lower" close={lowerClose} />
      </>,
    ),
  );
  expect(document.body.style.overflow).toBe("hidden");
  expect(document.activeElement).toBe(lower);
  // Closing the upper panel returns control to the still-mounted lower panel.
  key("Escape");
  expect(lowerClose).toHaveBeenCalledTimes(1);
});
