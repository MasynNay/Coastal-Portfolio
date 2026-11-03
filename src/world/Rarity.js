// Bugs and aquatic catches use the same rarity rules. Callers choose an eligible
// habitat/category first; this helper never broadens that pool. Keep catalog
// order stable because seeded encounters depend on it.
export const rarities = [
  "Common",
  "Uncommon",
  "Rare",
  "Very rare",
  "Super rare",
];
const weights = { Common: 8, Uncommon: 4, Rare: 1.2, "Very rare": 0.4 };
const exceptionalChance = 0.001;

export function chooseByRarity(eligible, random = Math.random) {
  if (!eligible.length) return null;
  const roll = random();
  const special = eligible.find((species) => species.rarity === "Super rare");
  if (roll < exceptionalChance && special) return special;
  const ordinary = eligible.filter(
    (species) => species.rarity !== "Super rare",
  );
  if (!ordinary.length) return special || null;
  const total = ordinary.reduce(
    (sum, species) => sum + weights[species.rarity],
    0,
  );
  let value =
    Math.max(0, (roll - exceptionalChance) / (1 - exceptionalChance)) * total;
  for (const species of ordinary) {
    value -= weights[species.rarity];
    if (value < 0) return species;
  }
  return ordinary.at(-1);
}
