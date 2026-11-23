import { useState, useRef, useEffect } from "react";
import {
  packs,
  cardCatalog,
  cardsById,
  checklistProgress,
} from "./CardCatalog";
import { cardKey } from "./CardCollection";
import { useCardSwipe } from "./CardApp";

// The binder shows one entry per printing. Duplicate quantities and reverse
// foils share completion; old keepsakes remain in their own collection.
export default function CardAlbum({ cards, renderCard }) {
  const [set, setSet] = useState("All"),
    [show, setShow] = useState("All"),
    [rarity, setRarity] = useState("All"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [limit, setLimit] = useState(24);
  const detail = useRef(null),
    returnTo = useRef(null),
    binder = useRef(null),
    savedScroll = useRef(0);
  const album = Object.values(cards),
    progress = checklistProgress(cards, set);
  const owned = new Map();
  for (const card of album) {
    const old = owned.get(card.id);
    owned.set(card.id, {
      ...card,
      quantity: (old?.quantity || 0) + card.quantity,
    });
  }
  const catalog =
    set === "Archive"
      ? album.filter((c) => !cardsById[c.id])
      : cardCatalog.filter((c) => set === "All" || c.setId === set);
  const visible = catalog.filter(
    (c) =>
      (show === "All" ||
        (show === "Missing" ? !owned.has(c.id) : owned.has(c.id))) &&
      (rarity === "All" || (c.tier || c.rarity) === rarity) &&
      c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const index = visible.findIndex((c) => c.id === selected),
    inspected = visible[index];
  function turn(step) {
    if (visible.length)
      setSelected(visible[(index + step + visible.length) % visible.length].id);
  }
  const swipe = useCardSwipe(turn);
  // Inspection is a separate screen, not another block above a 200-card grid.
  // Restore keyboard focus to the chosen slot when returning to the binder.
  useEffect(() => {
    if (selected) detail.current?.focus({ preventScroll: true });
    else if (binder.current) {
      const slot = [...binder.current.querySelectorAll("[data-card-id]")].find(
        (node) => node.dataset.cardId === returnTo.current,
      );
      const scroller = binder.current.closest(".card-app-main");
      if (scroller) scroller.scrollTop = savedScroll.current;
      slot?.focus({ preventScroll: true });
    }
  }, [selected]);
  if (inspected)
    return (
      <div
        className="card-inspection-screen"
        ref={detail}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setSelected(null);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            e.stopPropagation();
            turn(e.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <button
          className="card-inventory-link"
          onClick={() => setSelected(null)}
        >
          ← Back to Binder
        </button>
        <div className="album-inspection" {...swipe}>
          {owned.has(inspected.id) ? (
            renderCard(owned.get(inspected.id), true)
          ) : (
            <div className="missing-card-detail">
              <span aria-hidden="true">◇</span>
              <h3>{inspected.name}</h3>
              <p>
                #{inspected.number} · {inspected.tier} · {inspected.pack}
              </p>
              <p>
                Not collected yet. Find this printing in {inspected.pack} packs.
              </p>
            </div>
          )}
        </div>
        <div className="card-page-controls">
          <button onClick={() => turn(-1)} aria-label="Previous card">
            ←
          </button>
          <span>
            {index + 1} / {visible.length}
          </span>
          <button onClick={() => turn(1)} aria-label="Next card">
            →
          </button>
        </div>
        <p className="card-gesture-hint">Swipe or use the arrows to browse</p>
      </div>
    );
  return (
    <div className="card-album" ref={binder}>
      <div className="album-progress">
        <h3>
          {set === "Archive"
            ? "Earlier Keepsakes"
            : `${progress.found} / ${progress.total} Collected`}
        </h3>
        {set !== "Archive" && (
          <progress
            value={progress.found}
            max={progress.total}
            aria-label="Card checklist completion"
          />
        )}
      </div>
      <label className="card-search">
        Find a Pokémon
        <input
          type="search"
          value={search}
          placeholder="Search by name"
          onChange={(e) => {
            setSearch(e.target.value);
            setLimit(24);
          }}
        />
      </label>
      <div className="album-view-controls" aria-label="Checklist visibility">
        {[
          ["All", "Full Checklist"],
          ["Owned", "My Cards"],
          ["Missing", "Missing Cards"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={show === id}
            onClick={() => {
              setShow(id);
              setLimit(24);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <details className="card-binder-filters">
        <summary>
          Filter Collection & Rarity
          {set !== "All" || rarity !== "All" ? " · Active" : ""}
        </summary>
        <div className="album-filters">
          <label>
            Collection
            <select
              value={set}
              onChange={(e) => {
                setSet(e.target.value);
                setLimit(24);
              }}
            >
              <option value="All">All Six Collections</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.cards.filter((c) => owned.has(c.id)).length}/
                  {p.cards.length}
                </option>
              ))}
              <option value="Archive">Earlier Keepsakes</option>
            </select>
          </label>
          <label>
            Rarity
            <select
              value={rarity}
              onChange={(e) => {
                setRarity(e.target.value);
                setLimit(24);
              }}
            >
              {[
                "All",
                "EX",
                "V",
                "VMAX",
                "VSTAR",
                "SIR",
                "Illustration Rare",
                "Secret Rare",
                "Shiny",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      </details>
      <p className="checklist-label">
        {visible.length} {show === "Missing" ? "missing" : "matching"} cards
      </p>
      <div className="card-album-grid">
        {visible.slice(0, limit).map((c) => {
          const collected = owned.get(c.id);
          return (
            <button
              key={cardKey(c)}
              data-card-id={c.id}
              className={collected ? "owned-card-slot" : "missing-card-slot"}
              aria-label={`${c.name} ${c.tier || c.rarity} ${collected ? `collected, quantity ${collected.quantity}` : "not collected"}`}
              onClick={(e) => {
                returnTo.current = String(c.id);
                savedScroll.current =
                  e.currentTarget.closest(".card-app-main")?.scrollTop || 0;
                setSelected(c.id);
              }}
            >
              {collected ? (
                renderCard(collected, false)
              ) : (
                <div className="locked-card">
                  <span className="locked-number">#{c.number}</span>
                  <span className="locked-symbol" aria-hidden="true">
                    ◇
                  </span>
                  <strong>{c.name}</strong>
                  <span>{c.tier}</span>
                  <small>NOT COLLECTED</small>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {visible.length > limit && (
        <button
          className="card-load-more"
          onClick={() => setLimit((n) => n + 24)}
        >
          Show More Cards · {Math.min(limit, visible.length)} / {visible.length}
        </button>
      )}
      {!visible.length && (
        <p className="card-empty">
          {show === "Missing"
            ? "Nothing missing from this selection!"
            : "No cards match these filters yet."}
        </p>
      )}
    </div>
  );
}
