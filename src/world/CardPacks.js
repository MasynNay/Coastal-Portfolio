import { useEffect, useRef, useState } from "react";
import { packs, cardArt } from "./CardCatalog";
import {
  collectPack,
  useCardCollection,
  ripOwnedPack,
  revealCard,
  nextCard,
  finishPack,
  cardKey,
} from "./CardCollection";
import TearPack, { PackArtwork } from "./TearPack";
import "./CardPacks.css";
export { packs, openPack } from "./CardCatalog";

export function PokemonCard({ card, quantity, large = false }) {
  return (
    <div
      className={`island-card ${large ? "is-large" : ""} ${card.variant === "Shiny" ? "is-shiny" : ""} rarity-${card.rarity.replaceAll(" ", "-").toLowerCase()}`}
    >
      <div className="card-topline">
        <strong>{card.name}</strong>
        <span>{card.variant === "Shiny" ? "✦ SHINY" : "POKÉMON"}</span>
      </div>
      <div className="card-illustration">
        <div className="card-halo" />
        <img
          src={cardArt(card, true)}
          onError={(e) => {
            if (e.currentTarget.src.includes("official-artwork"))
              e.currentTarget.src = cardArt(card);
          }}
          alt={`${card.variant === "Shiny" ? "Shiny " : ""}${card.name}`}
          loading="lazy"
        />
        {card.variant === "Shiny" && (
          <span className="card-sparkles" aria-hidden="true">
            ✦ ⋆ ✧
          </span>
        )}
      </div>
      <span className="card-rarity">{card.rarity}</span>
      <p>{card.pack}</p>
      <footer>
        <span>ISLAND KEEPSAKE</span>
        {quantity && <strong>×{quantity}</strong>}
      </footer>
    </div>
  );
}
// The machine only dispenses sealed packs. The visitor owns when and where to
// open them; opening and the card album both live in Inventory → Card Collection.
export default function CardPacks({ onInventory }) {
  const state = useCardCollection(),
    [notice, setNotice] = useState("");
  return (
    <section className="card-machine">
      <p>
        Choose a set. Your sealed pack goes into your inventory, ready to open
        whenever you like.
      </p>
      <div className="pack-machine-grid">
        {packs.map((pack) => (
          <article key={pack.id}>
            <div className="pack-machine-art">
              <PackArtwork pack={pack} />
            </div>
            <h3>{pack.name}</h3>
            <p>{pack.type}</p>
            <small>{state.packs[pack.id] || 0} unopened in your bag</small>
            <button
              disabled={(state.packs[pack.id] || 0) >= 99}
              onClick={() => {
                if (collectPack(pack.id))
                  setNotice(
                    `${pack.name} dispensed! Find it in Inventory → Card Collection.`,
                  );
              }}
            >
              Collect Pack
            </button>
          </article>
        ))}
      </div>
      <p role="status" className="card-notice">
        {notice ||
          "Every pack is free. Five different Pokémon, with a chance of a shiny."}
      </p>
      {onInventory && (
        <button className="world-primary" onClick={onInventory}>
          Open Card Collection
        </button>
      )}
    </section>
  );
}
export function CardCollection({ onBack }) {
  const state = useCardCollection(),
    [tab, setTab] = useState("packs"),
    [opening, setOpening] = useState(null),
    [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState(null);
  const album = Object.values(state.cards),
    pending = state.pending;
  const pack = packs.find((p) => p.id === (pending?.setId || opening));
  const visible = album.filter(
    (c) =>
      filter === "All" ||
      (filter === "Shiny" && c.variant === "Shiny") ||
      c.setId === filter,
  );
  const revealFrame = useRef(null);
  const revealIndex = pending?.index,
    revealFace = pending?.flipped;
  useEffect(() => {
    revealFrame.current?.scrollIntoView?.({ block: "center" });
  }, [revealIndex, revealFace]);
  const selectedCard =
    visible.find((c) => cardKey(c) === selected) || visible[0];
  return (
    <section className="card-collection">
      <div className="collection-toolbar">
        <button onClick={onBack}>← Inventory</button>
        <button
          onClick={() => {
            setOpening(null);
            setTab(tab === "packs" ? "album" : "packs");
          }}
        >
          {tab === "packs" ? "View Card Album" : "View Unopened Packs"}
        </button>
      </div>
      {pending ? (
        <div className="pack-reveal-stage">
          <p>
            {pack?.name} · Card {pending.index + 1} of 5
          </p>
          <button
            ref={revealFrame}
            className={`reveal-card-button ${pending.flipped ? "is-flipped" : ""}`}
            onClick={() => (pending.flipped ? nextCard() : revealCard())}
            aria-label={
              pending.flipped
                ? `Next card after ${pending.cards[pending.index].name}`
                : "Turn over this card"
            }
          >
            {pending.flipped ? (
              <PokemonCard
                key={pending.index}
                card={pending.cards[pending.index]}
                large
              />
            ) : (
              <span className="island-card-back">
                <span>ISLAND COLLECTION</span>
                <i>◉</i>
                <strong>Tap to reveal</strong>
              </span>
            )}
          </button>
          <p role="status">
            {pending.flipped
              ? `${pending.cards[pending.index].variant === "Shiny" ? "A shiny! " : ""}${pending.cards[pending.index].name} · ${pending.cards[pending.index].rarity}`
              : "Your next discovery is waiting."}
          </p>
          <div className="card-reveal-actions">
            <button
              onClick={() => (pending.flipped ? nextCard() : revealCard())}
            >
              {pending.flipped
                ? pending.index === 4
                  ? "Finish Pack"
                  : "Next Card"
                : "Reveal Card"}
            </button>
            <button
              onClick={() => {
                finishPack();
                setOpening(null);
                setTab("album");
              }}
            >
              Save All to Album
            </button>
          </div>
        </div>
      ) : opening && pack ? (
        <>
          <button onClick={() => setOpening(null)}>
            Back to Unopened Packs
          </button>
          <TearPack
            key={opening}
            pack={pack}
            onRip={() => {
              ripOwnedPack(opening);
              setOpening(null);
            }}
          />
        </>
      ) : tab === "packs" ? (
        <>
          <p>
            Sealed packs stay in your bag until you tear them open. Your cards
            are saved even if you close during a reveal.
          </p>
          <div className="pack-bag-grid">
            {packs
              .filter((p) => state.packs[p.id] > 0)
              .map((p) => (
                <button key={p.id} onClick={() => setOpening(p.id)}>
                  <PackArtwork pack={p} />
                  <strong>
                    {p.name} ×{state.packs[p.id]}
                  </strong>
                  <span>Open Pack</span>
                </button>
              ))}
          </div>
          {!Object.values(state.packs).some((n) => n > 0) && (
            <p className="card-empty">
              Your pack bag is empty. Visit the dispenser beside the Pokémon
              house to collect a pack.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="card-album-heading">
            <p>
              {album.length} different cards ·{" "}
              {album.filter((c) => c.variant === "Shiny").length} shiny
              discoveries · {album.reduce((n, c) => n + c.quantity, 0)} cards
              collected
            </p>
            <label>
              Show{" "}
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setSelected(null);
                }}
              >
                <option>All</option>
                <option>Shiny</option>
                {packs.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedCard && (
            <div className="selected-album-card">
              <PokemonCard
                card={selectedCard}
                quantity={selectedCard.quantity}
                large
              />
            </div>
          )}
          <div className="card-album-grid">
            {visible.map((c) => (
              <button
                key={cardKey(c)}
                aria-pressed={selectedCard === c}
                onClick={() => setSelected(cardKey(c))}
              >
                <PokemonCard card={c} quantity={c.quantity} />
              </button>
            ))}
          </div>
          {!visible.length && (
            <p className="card-empty">
              No cards in this part of your album yet. Every opened pack adds
              five discoveries here.
            </p>
          )}
        </>
      )}
      <p className="card-credit">
        Fan-made island cards. Character sprites: PokeAPI / Nintendo, Creatures
        and GAME FREAK. Saved on this device.
      </p>
    </section>
  );
}
