// Refresh the English physical TCG checklist from TCGdex. The game ships the
// compact metadata locally; only artwork is fetched when a card is displayed.
const { execFileSync } = require("node:child_process");
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const api = "https://api.tcgdex.net/v2/en/";
const assets = "https://assets.tcgdex.net/en/";
const get = (resource) =>
  JSON.parse(
    execFileSync(
      "curl",
      ["-fsSL", "--retry", "2", "--max-time", "60", api + resource],
      { maxBuffer: 32 * 1024 * 1024 },
    ),
  );
const sets = get("sets").filter(
  (s) => !/^(?:[AB]\d+[a-z]?|P-[AB])$/.test(s.id),
);
const cards = get("cards");
const rarities = get("rarities").map((r) =>
  typeof r === "string" ? r : r.name,
);
const byRarity = new Map();
for (const [i, rarity] of rarities.entries()) {
  for (const card of get("cards?rarity=" + encodeURIComponent("eq:" + rarity)))
    byRarity.set(card.id, i);
  if (i % 10 === 0) console.log("Imported rarity", rarity);
}
const ordered = [...sets].sort((a, b) => b.id.length - a.id.length);
const grouped = new Map(sets.map((s) => [s.id, []]));
for (const c of cards) {
  const set = ordered.find((s) => c.id.startsWith(s.id + "-"));
  if (!set) continue;
  grouped
    .get(set.id)
    .push([
      c.id,
      c.localId,
      c.name,
      byRarity.get(c.id) ?? -1,
      c.image?.startsWith(assets)
        ? c.image.slice(assets.length)
        : c.image || null,
    ]);
}
const output = sets
  .filter((s) => grouped.get(s.id).length)
  .map((s) => ({
    id: s.id,
    name: s.name,
    logo: s.logo || null,
    cards: grouped.get(s.id),
  }));
writeFileSync(
  join(__dirname, "../src/world/OfficialCards.json"),
  JSON.stringify({ rarities, sets: output }) + "\n",
);
console.log(
  `${output.length} collections, ${output.reduce((n, s) => n + s.cards.length, 0)} printings`,
);
