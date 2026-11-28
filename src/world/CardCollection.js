import { useEffect, useState } from "react";
import { packs, pokemonNames, openPack, cardsById } from "./CardCatalog";
const key = "island-card-collection-v2",
  event = "island-cards-changed";
export const cardKey = (c) =>
  cardsById[c.id]
    ? `${c.id}-${c.variant || "Regular"}`
    : `${c.id}-${c.rarity}-${c.variant || "Regular"}`;
export function cleanCards(data) {
  const result = {};
  for (const c of Object.values(data || {})) {
    if (
      !c ||
      (!pokemonNames[c.id] && !cardsById[c.id]) ||
      !Number.isFinite(c.quantity) ||
      c.quantity < 1
    )
      continue;
    const card = {
      ...c,
      ...(cardsById[c.id] || { name: pokemonNames[c.id] }),
      variant: ["Shiny", "Reverse Holo"].includes(c.variant)
        ? c.variant
        : "Regular",
      quantity: Math.min(9999, Math.floor(c.quantity)),
    };
    if (
      !cardsById[c.id] &&
      !["Common", "Uncommon", "Rare", "Holo Rare", "Legendary"].includes(
        card.rarity,
      )
    )
      continue;
    result[cardKey(card)] = {
      ...card,
      quantity: (result[cardKey(card)]?.quantity || 0) + card.quantity,
    };
  }
  return result;
}
// Shared by normal loading and backup validation; incoming metadata is replaced
// with the shipped catalog, while quantities and an unfinished reveal survive.
export function normalizeCardCollection(saved) {
  if (!saved || saved.version !== 2) return null;
  const p = saved.pending;
  const pending =
    Array.isArray(p?.cards) &&
    p.cards.length === 5 &&
    packs.some((pack) => pack.id === p.setId) &&
    Number.isInteger(p.index) &&
    p.index >= 0 &&
    p.index < 5 &&
    p.cards.every(
      (c) =>
        c &&
        (cardsById[c.id] ||
          (pokemonNames[c.id] &&
            ["Common", "Uncommon", "Rare", "Holo Rare", "Legendary"].includes(
              c.rarity,
            ))),
    )
      ? {
          setId: p.setId,
          index: p.index,
          flipped: !!p.flipped,
          cards: p.cards.map((c) => ({
            ...Object.values(cleanCards({ card: { ...c, quantity: 1 } }))[0],
            quantity: 1,
          })),
        }
      : null;
  return {
    version: 2,
    packs: Object.fromEntries(
      packs.map((pack) => [
        pack.id,
        Math.min(
          99,
          Math.max(0, Math.floor(Number(saved.packs?.[pack.id]) || 0)),
        ),
      ]),
    ),
    cards: cleanCards(saved.cards),
    pending,
  };
}
export function readCardCollection() {
  try {
    const current = normalizeCardCollection(
      JSON.parse(localStorage.getItem(key)),
    );
    if (current) return current;
    return {
      version: 2,
      packs: {},
      cards: cleanCards(
        JSON.parse(localStorage.getItem("island-card-packs-v1")) || {},
      ),
      pending: null,
    };
  } catch {
    return { version: 2, packs: {}, cards: {}, pending: null };
  }
}
let memory = null;
function read() {
  return memory || readCardCollection();
}
function save(value) {
  memory = null;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    memory = value;
    /* The current visit remains playable if storage is full or private. */
  }
  window.dispatchEvent(new Event(event));
  return value;
}
export function collectPack(id) {
  if (!packs.some((p) => p.id === id)) return false;
  const state = read(),
    count = state.packs[id] || 0;
  if (count >= 99) return false;
  save({ ...state, packs: { ...state.packs, [id]: count + 1 } });
  return true;
}
// Consuming the sealed pack, awarding its five cards and recording the reveal
// are one saved transaction. Closing midway cannot duplicate or lose rewards.
export function ripOwnedPack(id, random = Math.random) {
  const state = read(),
    pack = packs.find((p) => p.id === id);
  if (!pack || state.pending || !state.packs[id]) return null;
  const known = new Set(Object.values(state.cards).map((c) => c.id));
  const cards = openPack(pack, random).map((c) => ({
      ...c,
      firstDiscovery: !known.has(c.id),
    })),
    album = { ...state.cards };
  cards.forEach((c) => {
    const id = cardKey(c);
    album[id] = { ...c, quantity: (album[id]?.quantity || 0) + 1 };
  });
  const pending = { setId: id, cards, index: 0, flipped: false };
  save({
    ...state,
    packs: { ...state.packs, [id]: state.packs[id] - 1 },
    cards: album,
    pending,
  });
  return pending;
}
export function revealCard() {
  const s = read();
  if (s.pending) save({ ...s, pending: { ...s.pending, flipped: true } });
}
export function nextCard() {
  const s = read(),
    p = s.pending;
  if (!p) return;
  if (!p.flipped) return revealCard();
  save({
    ...s,
    pending: p.index >= 4 ? null : { ...p, index: p.index + 1, flipped: false },
  });
}
export function finishPack() {
  const s = read();
  save({ ...s, pending: null });
}
export function useCardCollection() {
  const [state, setState] = useState(read);
  useEffect(() => {
    const update = () => setState(read());
    const storage = (e) => {
      if (e.key === key) {
        memory = null;
        update();
      }
    };
    window.addEventListener(event, update);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(event, update);
      window.removeEventListener("storage", storage);
    };
  }, []);
  return state;
}
