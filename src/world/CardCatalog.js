import sets from "./TradingCards.json";
import { cardArt as legacyArt } from "./LegacyCards";
export { pokemonNames } from "./LegacyCards";

// A finite, curated checklist of real printings, with complete card faces.
// Data is checked in: opening a pack never depends on a live API request.
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
  const rare = take(
    matching.length
      ? matching
      : pack.cards.filter((c) => !["Common", "Uncommon"].includes(c.tier)),
    random,
  );
  const used = new Set([rare.dexId]),
    cards = [];
  for (let i = 0; i < 4; i++) {
    const pool = pack.cards.filter(
      (c) => !used.has(c.dexId) && ["Common", "Uncommon"].includes(c.tier),
    );
    const card = take(
      pool.length ? pool : pack.cards.filter((c) => !used.has(c.dexId)),
      random,
    );
    used.add(card.dexId);
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
