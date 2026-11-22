import { useEffect, useRef, useState } from "react";
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
            <p className="pack-highlights">{pack.type}</p>
            <p>{pack.cards.length} card printings to collect</p>
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
          "Five different Pokémon. EX, VMAX, illustration rares, secret rares, and shiny printings are waiting."}
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
    [opening, setOpening] = useState(null);
  const pending = state.pending;
  const pack = packs.find((p) => p.id === (pending?.setId || opening));
  const revealFrame = useRef(null);
  const revealIndex = pending?.index,
    revealFace = pending?.flipped;
  useEffect(() => {
    revealFrame.current?.scrollIntoView?.({ block: "center" });
  }, [revealIndex, revealFace]);
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
              ? `${pending.cards[pending.index].variant === "Shiny" ? "A shiny! " : ""}${pending.cards[pending.index].name} · ${pending.cards[pending.index].tier || pending.cards[pending.index].rarity}`
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
          <CardAlbum
            cards={state.cards}
            renderCard={(card, large) => (
              <PokemonCard card={card} quantity={card.quantity} large={large} />
            )}
          />
        </>
      )}
      <p className="card-credit">
        Card artwork and catalog: TCGdex / The Pokémon Company. Free island
        packs use custom odds and curated checklists, not full retail sets.
        Saved on this device.
      </p>
    </section>
  );
}
