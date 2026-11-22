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
test("the missing checklist excludes owned prints and filters by set and chase type", () => {
  const card = cardCatalog.find((c) => c.tier === "SIR");
  act(() =>
    root.render(
      <CardAlbum
        cards={{ owned: { ...card, quantity: 4 } }}
        renderCard={(c) => <span>{c.name} owned</span>}
      />,
    ),
  );
  expect(host.textContent).toContain("1 / 200 Collected");
  expect(host.querySelectorAll(".missing-card-slot")).toHaveLength(199);
  const missing = [...host.querySelectorAll("button")].find(
    (b) => b.textContent === "Missing Cards",
  );
  act(() => missing.click());
  expect(host.querySelectorAll(".owned-card-slot")).toHaveLength(0);
  expect(host.querySelectorAll(".missing-card-slot")).toHaveLength(199);
  const filters = host.querySelectorAll("select");
  act(() => {
    filters[0].value = card.setId;
    filters[0].dispatchEvent(new Event("change", { bubbles: true }));
  });
  const size = cardCatalog.filter((c) => c.setId === card.setId).length;
  expect(host.textContent).toContain(`1 / ${size} Collected`);
  act(() => {
    filters[1].value = "SIR";
    filters[1].dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(host.querySelectorAll(".card-album-grid > button")).toHaveLength(
    cardCatalog.filter((c) => c.setId === card.setId && c.tier === "SIR")
      .length,
  );
});
