import { useEffect, useState } from "react";
import { packs, cardArt, cardsById, isChase } from "./CardCatalog";
import {
  collectPack,
  useCardCollection,
  ripOwnedPack,
  revealCard,
  nextCard,
  finishPack,
} from "./CardCollection";
import TearPack, { PackArtwork } from "./TearPack";
import CardAlbum from "./CardAlbum";
import { CardApp, useCardSwipe } from "./CardApp";
import "./CardPacks.css";
export { packs, openPack } from "./CardCatalog";

export function PokemonCard({ card, quantity, large = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [card.id]);
  if (cardsById[card.id])
    return (
      <figure
        className={`tcg-card ${large ? "is-large" : ""} ${card.holo || card.variant !== "Regular" ? "is-foil" : ""} ${isChase(card) ? "is-chase" : ""} tier-${card.tier.toLowerCase().replaceAll(" ", "-")}`}
      >
        <div className="tcg-card-face">
          {failed ? (
            <div className="card-art-unavailable">
              <strong>{card.name}</strong>
              <span>
                {card.tier} · #{card.number}
              </span>
              <small>Artwork is temporarily unavailable</small>
            </div>
          ) : (
            <img
              draggable={false}
              src={cardArt(card, large)}
              alt={`${card.name}, ${card.rarity}, ${card.pack} #${card.number}`}
              loading={large ? "eager" : "lazy"}
              onError={(e) => {
                if (e.currentTarget.src !== cardArt(card))
                  e.currentTarget.src = cardArt(card);
                else setFailed(true);
              }}
            />
          )}
          <span className="card-foil" aria-hidden="true" />
          {isChase(card) && (
            <span className="chase-glimmer" aria-hidden="true" />
          )}
        </div>
        <figcaption>
          <strong>{card.name}</strong>
          <span className="printing-tier">
            {card.tier}
            {card.variant === "Reverse Holo" ? " · Reverse Holo" : ""}
          </span>
          <small>
            #{card.number} · {card.pack}
            {quantity ? ` · ×${quantity}` : ""}
          </small>
        </figcaption>
      </figure>
    );
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
          draggable={false}
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
export default function CardPacks({ onInventory, onBack }) {
  const state = useCardCollection(),
    [notice, setNotice] = useState(""),
    [index, setIndex] = useState(0);
  const pack = packs[index];
  function changePack(step) {
    setIndex((n) => (n + step + packs.length) % packs.length);
    setNotice("");
  }
  const swipe = useCardSwipe(changePack);
  return (
    <CardApp
      active="shop"
      state={state}
      onBack={onBack}
      onNavigate={(tab) => tab !== "shop" && onInventory(tab)}
    >
      <div className="card-shop-heading">
        <h3>Choose Your Next Discovery</h3>
        <p>Free packs. Five cards. Yours to keep.</p>
      </div>
      <div className="card-shop-feature" {...swipe}>
        <div className="card-shop-art">
          <PackArtwork key={pack.id} pack={pack} />
        </div>
        <div className="card-shop-details">
          <small>
            COLLECTION {index + 1} / {packs.length}
          </small>
          <h3>{pack.name}</h3>
          <p>{pack.type}</p>
          <span>
            {pack.cards.length} printings · {state.packs[pack.id] || 0} packs in
            bag
          </span>
          <button
            className="world-primary"
            disabled={(state.packs[pack.id] || 0) >= 99}
            onClick={() => {
              if (collectPack(pack.id))
                setNotice(`${pack.name} added to your pack bag.`);
            }}
          >
            Collect Pack
          </button>
        </div>
      </div>
      <div className="card-page-controls">
        <button onClick={() => changePack(-1)} aria-label="Previous collection">
          ←
        </button>
        <div className="card-page-dots" aria-label="Choose a collection">
          {packs.map((p, n) => (
            <button
              key={p.id}
              aria-label={p.name}
              aria-pressed={n === index}
              onClick={() => {
                setIndex(n);
                setNotice("");
              }}
            >
              <span />
            </button>
          ))}
        </div>
        <button onClick={() => changePack(1)} aria-label="Next collection">
          →
        </button>
      </div>
      <p role="status" className="card-shop-notice">
        {notice || "Swipe to browse · Open your packs in the Packs tab"}
      </p>
    </CardApp>
  );
}

// Browsing the binder or bag does not discard a saved reveal. Resume takes the
// visitor back to the exact card they left, using the existing atomic save flow.
export function CardCollection({ onBack, onShop, initialTab = "packs" }) {
  const state = useCardCollection(),
    [tab, setTab] = useState(initialTab),
    [opening, setOpening] = useState(null),
    [revealing, setRevealing] = useState(
      !!state.pending && initialTab === "packs",
    );
  const pending = state.pending;
  const pack = packs.find((p) => p.id === (pending?.setId || opening));
  const advance = () => (pending?.flipped ? nextCard() : revealCard());
  const swipe = useCardSwipe((direction) => {
    if (direction === 1 && pending) advance();
  });
  function navigate(next) {
    setOpening(null);
    setRevealing(false);
    if (next === "shop") onShop();
    else setTab(next);
  }
  return (
    <CardApp active={tab} state={state} onBack={onBack} onNavigate={navigate}>
      {tab === "album" ? (
        <CardAlbum
          cards={state.cards}
          renderCard={(card, large) => (
            <PokemonCard card={card} quantity={card.quantity} large={large} />
          )}
        />
      ) : pending && revealing ? (
        <div className="pack-reveal-stage">
          <button
            className="card-inventory-link"
            onClick={() => setRevealing(false)}
          >
            ← Back to Packs
          </button>
          <p>
            {pack?.name} · Card {pending.index + 1} of 5
          </p>
          <button
            className={`reveal-card-button ${pending.flipped ? "is-flipped" : ""}`}
            {...swipe}
            onClick={advance}
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
          <div className="card-reveal-actions">
            <button className="world-primary" onClick={advance}>
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
                setRevealing(false);
                setTab("album");
              }}
            >
              Save All to Binder
            </button>
          </div>
          <p className="card-gesture-hint">
            Tap the card or swipe left to continue.
          </p>
        </div>
      ) : opening && pack ? (
        <>
          <button
            className="card-inventory-link"
            onClick={() => setOpening(null)}
          >
            ← Back to Packs
          </button>
          <TearPack
            key={opening}
            pack={pack}
            onRip={() => {
              ripOwnedPack(opening);
              setOpening(null);
              setRevealing(true);
            }}
          />
        </>
      ) : (
        <div className="card-bag">
          <h3>Your Unopened Packs</h3>
          {pending && (
            <button
              className="card-resume world-primary"
              onClick={() => setRevealing(true)}
            >
              Resume Open Pack · Card {pending.index + 1} of 5
            </button>
          )}
          <div className="pack-bag-grid">
            {packs
              .filter((p) => state.packs[p.id] > 0)
              .map((p) => (
                <button
                  key={p.id}
                  disabled={!!pending}
                  onClick={() => setOpening(p.id)}
                >
                  <PackArtwork pack={p} />
                  <strong>{p.name}</strong>
                  <span>Open Pack · ×{state.packs[p.id]}</span>
                </button>
              ))}
          </div>
          {!Object.values(state.packs).some((n) => n > 0) && (
            <div className="card-empty">
              <p>Your next pack is waiting at the shop.</p>
              <button onClick={onShop}>Browse Collections</button>
            </div>
          )}
          {pending && <p>Finish your open pack before opening another.</p>}
          <details className="card-save-info">
            <summary>About Your Collection</summary>
            <p>
              Saved on this device, including unfinished reveals. Free packs use
              custom odds and curated checklists, not full retail sets. Card
              artwork and catalog: TCGdex / The Pokémon Company.
            </p>
          </details>
        </div>
      )}
    </CardApp>
  );
}
