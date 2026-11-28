import curated from "./TradingCards.json";
import official from "./OfficialCards.json";
import { cardArt as legacyArt, pokemonNames } from "./LegacyCards";
export { pokemonNames } from "./LegacyCards";

const assets = "https://assets.tcgdex.net/en/";
const oldCards = new Map(curated.flatMap((s) => s.cards).map((c) => [c.id, c]));
const oldSets = new Map(curated.map((s) => [s.sourceSet, s]));
const pokemonIds = new Map(
  Object.entries(pokemonNames).map(([id, name]) => [
    name.toLowerCase(),
    Number(id),
  ]),
);
const speciesName = (c) =>
  c.name.replace(/\s+(?:ex|gx|v(?:max|star)?|lv\.x|prime)$/i, "").toLowerCase();
function tierFor(rarity, name) {
  if (/special illustration/i.test(rarity)) return "SIR";
  if (/shiny/i.test(rarity)) return "Shiny";
  if (/illustration/i.test(rarity)) return "Illustration Rare";
  if (/VMAX/i.test(rarity)) return "VMAX";
  if (/VSTAR/i.test(rarity)) return "VSTAR";
  if (/Holo Rare V$/i.test(rarity)) return "V";
  if (/secret|hyper|black white|mega attack/i.test(rarity))
    return "Secret Rare";
  if (/\bex$/i.test(name) && /rare/i.test(rarity)) return "EX";
  if (/ultra|prime|legend|full art|radiant|amazing/i.test(rarity))
    return "Secret Rare";
  return ["Common", "Uncommon"].includes(rarity) ? rarity : "Rare";
}
const colors = ["#475e8d", "#8a535f", "#457c63", "#82569a", "#a87840"];
// Preserve the six original bag IDs and card IDs so existing saves still work.
const sets = official.sets.map((s, i) => {
  const original = oldSets.get(s.id),
    id = original?.id || s.id;
  const cards = s.cards.map(([key, number, name, rarityIndex, path]) => {
    const rarity = official.rarities[rarityIndex] || "Unclassified";
    const url = path ? (/^https:\/\//.test(path) ? path : assets + path) : null;
    return (
      oldCards.get(key) || {
        id: key,
        number,
        name,
        dexId: name,
        rarity,
        tier: tierFor(rarity, name),
        image: url && `${url}/high.webp`,
        thumbnail: url && `${url}/low.webp`,
        setId: id,
        pack: s.name,
        holo: /holo|shiny|illustration/i.test(rarity),
        reverse: false,
      }
    );
  });
  for (const c of original?.cards || [])
    if (!cards.some((p) => p.id === c.id)) cards.push(c);
  const mascot = [
    ...cards.filter((c) => !["Common", "Uncommon", "Rare"].includes(c.tier)),
    ...cards,
  ]
    .map((c) => pokemonIds.get(speciesName(c)))
    .find(Boolean);
  return {
    id,
    name: s.name,
    sourceSet: s.id,
    color: original?.color || colors[i % colors.length],
    mascot: original?.mascot || mascot || null,
    logo: s.logo && s.logo + ".webp",
    cards,
  };
});
// Keep the familiar six collections first; the complete catalog follows.
sets.sort(
  (a, b) =>
    (curated.findIndex((s) => s.id === a.id) + 1 || 1000) -
    (curated.findIndex((s) => s.id === b.id) + 1 || 1000),
);
export const cardCatalog = sets.flatMap((set) => set.cards);
export const cardsById = Object.fromEntries(cardCatalog.map((c) => [c.id, c]));
export const packs = sets.map((set) => ({
  ...set,
  ids: set.cards.map((c) => c.id),
  type: [...new Set(set.cards.map((c) => c.tier))]
    .filter((tier) => !["Common", "Uncommon", "Rare"].includes(tier))
    .join(" · "),
}));
export const cardArt = (card, detail = false) => {
  const printing = cardsById[card.id];
  return printing
    ? detail
      ? printing.image
      : printing.thumbnail
    : legacyArt(card, detail);
};
export const isChase = (card) =>
  !["Common", "Uncommon", "Rare"].includes(card.tier);
const take = (pool, random) =>
  pool[
    Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  ];

// Playful island odds, not retail booster odds. Four regular printings and one
// rare/chase slot; alternate prints of the same species cannot share a pack.
export function openPack(pack, random = Math.random) {
  const roll = random(),
    tier =
      roll < 0.08
        ? "SIR"
        : roll < 0.15
          ? "Secret Rare"
          : roll < 0.25
            ? "Illustration Rare"
            : roll < 0.38
              ? "Shiny"
              : roll < 0.55
                ? "VMAX"
                : roll < 0.7
                  ? "EX"
                  : roll < 0.8
                    ? "VSTAR"
                    : roll < 0.9
                      ? "V"
                      : "Rare";
  const matching = pack.cards.filter((c) => c.tier === tier);
  const rarePool = pack.cards.filter(
    (c) => !["Common", "Uncommon"].includes(c.tier),
  );
  const rare = take(
    matching.length ? matching : rarePool.length ? rarePool : pack.cards,
    random,
  );
  const species = speciesName;
  const used = new Set([species(rare)]),
    ids = new Set([rare.id]),
    cards = [];
  for (let i = 0; i < 4; i++) {
    const pool = pack.cards.filter(
      (c) => !used.has(species(c)) && ["Common", "Uncommon"].includes(c.tier),
    );
    const distinct = pack.cards.filter((c) => !used.has(species(c)));
    const printings = pack.cards.filter((c) => !ids.has(c.id));
    const card = take(
      pool.length
        ? pool
        : distinct.length
          ? distinct
          : printings.length
            ? printings
            : pack.cards,
      random,
    );
    used.add(species(card));
    ids.add(card.id);
    cards.push(card);
  }
  cards.push(rare);
  return cards.map((c) => ({
    ...c,
    variant:
      c.tier === "Shiny"
        ? "Shiny"
        : c.reverse && random() < 0.18
          ? "Reverse Holo"
          : "Regular",
  }));
}
// Completion counts printings, independently of duplicate/foil quantities.
export function checklistProgress(album, setId = "All") {
  const available = cardCatalog.filter(
    (c) => setId === "All" || c.setId === setId,
  );
  const owned = new Set(
    Object.values(album)
      .filter((c) => c.quantity > 0)
      .map((c) => c.id),
  );
  const found = available.filter((c) => owned.has(c.id)).length;
  return { found, total: available.length, missing: available.length - found };
}
