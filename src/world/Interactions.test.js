import { familyGreeting } from "./Interactions";
test("every Masyn greeting is affectionate except one of twenty RNG buckets", () => {
  const outcomes = Array.from(
    {
      length: 20,
    },
    (_, i) => familyGreeting("masyn", "mi-shell", () => (i + 0.5) / 20),
  );
  expect(outcomes.filter((x) => x === "encounter")).toHaveLength(1);
  expect(outcomes.filter((x) => x === "affection")).toHaveLength(19);
  expect(familyGreeting("fallyn", "mi-shell", () => 0)).toBe("person");
  expect(familyGreeting("masyn", "ezra", () => 0)).toBe("person");
});
