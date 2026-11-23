import { act } from "react";
import { createRoot } from "react-dom/client";
import CardAlbum from "./CardAlbum";
import { cardCatalog } from "./CardCatalog";
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
const button = (label) =>
  [...host.querySelectorAll("button")].find((b) => b.textContent === label);
function render(cards = {}) {
  act(() =>
    root.render(
      <CardAlbum
        cards={cards}
        renderCard={(c) => <span>{c.name} owned</span>}
      />,
    ),
  );
}
function change(node, value) {
  act(() => {
    node.value = value;
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
test("binder paginates the complete checklist and combines ownership, set and rarity filters", () => {
  const card = cardCatalog.find((c) => c.tier === "SIR");
  render({ owned: { ...card, quantity: 4 } });
  expect(host.textContent).toContain("1 / 200 Collected");
  expect(host.querySelectorAll(".card-album-grid > button")).toHaveLength(24);
  act(() => button("Show More Cards · 24 / 200").click());
  expect(host.querySelectorAll(".card-album-grid > button")).toHaveLength(48);
  act(() => button("Missing Cards").click());
  expect(host.querySelectorAll(".owned-card-slot")).toHaveLength(0);
  expect(host.textContent).toContain("199 missing cards");
  const filters = host.querySelectorAll("select");
  change(filters[0], card.setId);
  change(filters[1], "SIR");
  const matches = cardCatalog.filter(
    (c) => c.setId === card.setId && c.tier === "SIR" && c.id !== card.id,
  ).length;
  expect(host.querySelectorAll(".card-album-grid > button")).toHaveLength(
    matches,
  );
  act(() => button("My Cards").click());
  expect(host.querySelectorAll(".owned-card-slot")).toHaveLength(1);
});
test("card inspection replaces the grid, supports keyboard browsing and Escape returns to the binder", () => {
  render();
  act(() => host.querySelector(".missing-card-slot").click());
  expect(host.querySelector(".card-album-grid")).toBeNull();
  expect(host.querySelector(".card-inspection-screen")).toBe(
    document.activeElement,
  );
  const first = host.querySelector(".missing-card-detail h3").textContent;
  act(() =>
    document.activeElement.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    ),
  );
  expect(host.querySelector(".missing-card-detail h3").textContent).not.toBe(
    first,
  );
  const escape = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  act(() => document.activeElement.dispatchEvent(escape));
  expect(escape.defaultPrevented).toBe(true);
  expect(host.querySelector(".card-album-grid")).not.toBeNull();
});
