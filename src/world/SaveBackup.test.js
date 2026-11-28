import { act } from "react";
import { createRoot } from "react-dom/client";
import SaveBackup from "./SaveBackup";
import { createIslandBackup } from "./IslandSave";
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
test("choosing a backup previews it without writing; only the restore button applies it", async () => {
  const reload = jest.fn(),
    backup = createIslandBackup();
  backup.entries["masyn-world-v1"] = { visited: ["skills"], secrets: [] };
  act(() => root.render(<SaveBackup onRestored={reload} />));
  const input = host.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", {
    value: [{ size: 400, text: async () => JSON.stringify(backup) }],
    configurable: true,
  });
  await act(async () =>
    input.dispatchEvent(new Event("change", { bubbles: true })),
  );
  expect(host.querySelector('[aria-label="Backup preview"]')).not.toBeNull();
  expect(localStorage.getItem("masyn-world-v1")).toBeNull();
  expect(reload).not.toHaveBeenCalled();
  act(() =>
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent === "Restore & Reopen Island")
      .click(),
  );
  expect(reload).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem("masyn-world-v1")).visited).toEqual([
    "skills",
  ]);
});
