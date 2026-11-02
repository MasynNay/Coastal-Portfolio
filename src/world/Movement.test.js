import { personHeight } from "./Movement";
import { outfits } from "./Wardrobe";
test("family heights follow the requested order; every costume uses its owners height", () => {
  expect(personHeight("masyn")).toBeGreaterThan(personHeight("mi-shell"));
  expect(personHeight("masyn") - personHeight("mi-shell")).toBeLessThan(0.15);
  expect(personHeight("mi-shell")).toBeGreaterThan(personHeight("fallyn"));
  expect(personHeight("fallyn")).toBeGreaterThan(personHeight("ezra"));
  expect(personHeight("ezra")).toBeGreaterThan(personHeight("fitzgerald"));
  for (const o of outfits) expect(personHeight(o.character)).toBeGreaterThan(0);
});
