import { useEffect, useState } from "react";
import { packs, pokemonNames, openPack } from "./CardCatalog";
const key = "island-card-collection-v2",
  event = "island-cards-changed";
export const cardKey = (c) => `${c.id}-${c.rarity}-${c.variant || "Regular"}`;
function cleanCards(data) {
  const result = {};
  for (const c of Object.values(data || {})) {
    if (
      !c ||
      !pokemonNames[c.id] ||
      !Number.isFinite(c.quantity) ||
      c.quantity < 1
    )
      continue;
    const card = {
      ...c,
      name: pokemonNames[c.id],
      variant: c.variant === "Shiny" ? "Shiny" : "Regular",
      quantity: Math.min(9999, Math.floor(c.quantity)),
    };
    if (
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
export function readCardCollection() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && saved.version === 2)
      return {
        version: 2,
        packs: Object.fromEntries(
          packs.map((p) => [
            p.id,
            Math.min(
              99,
              Math.max(0, Math.floor(Number(saved.packs?.[p.id]) || 0)),
            ),
          ]),
        ),
        cards: cleanCards(saved.cards),
        pending:
          Array.isArray(saved.pending?.cards) &&
          saved.pending.cards.length === 5 &&
          packs.some((p) => p.id === saved.pending.setId) &&
          Number.isInteger(saved.pending.index) &&
          saved.pending.index >= 0 &&
          saved.pending.index < 5 &&
          saved.pending.cards.every((c) => c && pokemonNames[c.id])
            ? saved.pending
            : null,
      };
    // Earlier cards are retained; no old album is erased on this upgrade.
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
  const cards = openPack(pack, random),
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
