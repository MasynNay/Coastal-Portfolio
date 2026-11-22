import { useState, useRef, useEffect } from "react";
import {
  packs,
  cardCatalog,
  cardsById,
  checklistProgress,
} from "./CardCatalog";
import { cardKey } from "./CardCollection";

// One checklist entry per printing. Foils and duplicate quantities belong to
// that printing, so collecting a reverse holo cannot inflate completion.
export default function CardAlbum({ cards, renderCard }) {
  const [set, setSet] = useState("All"),
    [show, setShow] = useState("All"),
    [selected, setSelected] = useState(null);
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
      show === "All" ||
      (show === "Missing"
        ? !owned.has(c.id)
        : show === "Owned"
          ? owned.has(c.id)
          : c.tier === show),
  );
  const inspected = visible.find((c) => c.id === selected);
  const inspection = useRef(null);
  useEffect(() => {
    inspection.current?.scrollIntoView?.({ block: "start" });
  }, [selected]);
  return (
    <div className="card-album">
      <div className="album-progress">
        <div>
          <small>ISLAND CHECKLIST</small>
          <h3>
            {set === "Archive"
              ? "Earlier Keepsakes"
              : `${progress.found} / ${progress.total} Collected`}
          </h3>
          <p>
            {set === "Archive"
              ? "Your original island cards are still here."
              : `${progress.missing} printings left to discover. Foils and duplicate cards share a checklist slot.`}
          </p>
        </div>
        {set !== "Archive" && (
          <progress
            value={progress.found}
            max={progress.total}
            aria-label="Card checklist completion"
          />
        )}
      </div>
      <div className="album-filters">
        <label>
          Collection
          <select
            value={set}
            onChange={(e) => {
              setSet(e.target.value);
              setSelected(null);
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
          Show
          <select
            value={show}
            onChange={(e) => {
              setShow(e.target.value);
              setSelected(null);
            }}
          >
            {[
              "All",
              "Owned",
              "Missing",
              "EX",
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
      <div className="album-view-controls" aria-label="Checklist visibility">
        {["All", "Owned", "Missing"].map((t) => (
          <button
            key={t}
            aria-pressed={show === t}
            onClick={() => {
              setShow(t);
              setSelected(null);
            }}
          >
            {t === "All"
              ? "Full Checklist"
              : t === "Owned"
                ? "My Cards"
                : "Missing Cards"}
          </button>
        ))}
      </div>
      {inspected && (
        <div className="album-inspection" ref={inspection}>
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
          <button onClick={() => setSelected(null)}>Close Card Details</button>
        </div>
      )}
      <p className="checklist-label">
        {visible.length} {show === "Missing" ? "missing" : "matching"} cards ·
        select a card to inspect it
      </p>
      <div className="card-album-grid">
        {visible.map((c) => {
          const collected = owned.get(c.id);
          return (
            <button
              key={cardKey(c)}
              className={collected ? "owned-card-slot" : "missing-card-slot"}
              aria-label={`${c.name} ${c.tier || c.rarity} ${collected ? `collected, quantity ${collected.quantity}` : "not collected"}`}
              aria-pressed={selected === c.id}
              onClick={() => setSelected(c.id)}
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
