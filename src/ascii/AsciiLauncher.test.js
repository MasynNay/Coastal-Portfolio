import { act } from "react";
import { createRoot } from "react-dom/client";
import AsciiLauncher from "./AsciiLauncher";
jest.mock("./AsciiApp", () => () => <div>Shared ASCII category menu</div>);

test("the portfolio launcher opens a focus-contained studio and returns focus after Escape", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<AsciiLauncher />));
    const open = host.querySelector("button");
    open.focus();
    await act(async () => open.click());
    const dialog = document.querySelector(
      '[role="dialog"][aria-label="ASCII Studio"]',
    );
    expect(dialog.textContent).toContain("Shared ASCII category menu");
    expect(dialog.contains(document.activeElement)).toBe(true);
    act(() =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(
      document.querySelector('[role="dialog"][aria-label="ASCII Studio"]'),
    ).toBeNull();
    expect(document.activeElement).toBe(open);
  } finally {
    act(() => root.unmount());
    host.remove();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
