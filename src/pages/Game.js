import BrandMark from "../components/BrandMark";
import { useEffect, useRef, useState } from "react";
import { HashLink } from "react-router-hash-link";
import {
  ArrowLeft,
  ArrowsFullscreen,
  BoxArrowUpRight,
  PlayFill,
  Joystick,
  ChevronLeft,
  ChevronRight,
  Key,
  Compass,
} from "react-bootstrap-icons";
import "../designs/glass.css";
import "./Game.css";
import { games } from "../data/games";
import GameCartridge from "../components/GameCartridge";
const returnUrl = "/design/glass?project=first#projects";
export default function Game() {
  const [gameIndex, setGameIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const player = useRef(null);
  const game = games[gameIndex];
  function selectGame(index) {
    if (index === gameIndex) return;
    setGameIndex((index + games.length) % games.length);
    setLoading(started);
    setNotice("");
  }
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The secret arcade · Masyn Nay";
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
    return () => {
      document.title = previousTitle;
    };
  }, []);
  function startGame() {
    setLoading(true);
    setStarted(true);
  }
  async function enterFullscreen() {
    try {
      if (!player.current?.requestFullscreen) {
        setNotice(
          "Use the player’s fullscreen control, or open it in a separate tab.",
        );
        return;
      }
      await player.current.requestFullscreen();
      setNotice("");
    } catch {
      setNotice(
        "Fullscreen wasn’t available. You can still play here or open the player separately.",
      );
    }
  }
  return (
    <div className="glass-site secret-page">
      <header className="secret-header">
        <HashLink
          to="/design/glass#home"
          className="brand-link"
          aria-label="Masyn Nay home"
        >
          <BrandMark decorative />
        </HashLink>
        <span className="secret-header-note">A LITTLE OFF THE BEATEN PATH</span>
        <HashLink to={returnUrl}>
          <ArrowLeft aria-hidden="true" /> Back to portfolio
        </HashLink>
      </header>
      <main className="secret-main">
        <div className="secret-intro">
          <div>
            <span className="glass-eyebrow">
              <i /> EASTER EGG / 001
            </span>
            <h1>
              You found the detour<span>.</span>
            </h1>
            <p>
              A little reward for being curious. Pick a game and take a break.
            </p>
          </div>
          <div className="secret-found-stamp">
            <Joystick aria-hidden="true" />
            <span>
              Curiosity
              <br />
              <strong>looks good on you.</strong>
            </span>
          </div>
        </div>
        <div className="secret-layout">
          <div
            className="secret-carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Pocket arcade games"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                selectGame(gameIndex + (event.key === "ArrowRight" ? 1 : -1));
              }
            }}
          >
            <button
              className="secret-carousel-arrow carousel-previous"
              aria-label="Previous game"
              onClick={() => selectGame(gameIndex - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <section
              className="secret-console"
              aria-label={`${game.name} game player`}
            >
              <div className="secret-console-top">
                <span>
                  <i /> POCKET ARCADE
                </span>
                <span>
                  {String(gameIndex + 1).padStart(2, "0")} /{" "}
                  {String(games.length).padStart(2, "0")}
                </span>
              </div>
              <div className="secret-screen" ref={player}>
                {started ? (
                  <>
                    <iframe
                      key={game.id}
                      src={game.url}
                      title={`${game.name} — ${game.kind === "island" ? "island" : "external"} game player`}
                      allowFullScreen
                      allow="fullscreen; gamepad; cross-origin-isolated"
                      onLoad={() => setLoading(false)}
                    />
                    {loading && (
                      <div className="secret-loading" role="status">
                        Opening game…
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`secret-start-screen game-${game.id}`}>
                    {game.id === "ruby" ? (
                      <div className="secret-ruby" aria-hidden="true">
                        <span />
                      </div>
                    ) : (
                      <div className="secret-game-symbol" aria-hidden="true">
                        {game.id === "kingdom-hearts" ? <Key /> : <Compass />}
                      </div>
                    )}
                    <span className="secret-game-edition">
                      {game.kind === "island" ? "AN ISLAND ORIGINAL" : "A LITTLE NOSTALGIA"}
                    </span>
                    <h2>
                      {game.title}
                      <span>{game.edition}</span>
                    </h2>
                    <button onClick={startGame}>
                      <PlayFill aria-hidden="true" /> Start game
                    </button>
                    <p>{game.kind === "island" ? "Play the island’s original mini-game here." : "Opens the RetroGames player here."}</p>
                  </div>
                )}
              </div>
              <div className="secret-console-tools">
                <span role="status">
                  {started
                    ? loading
                      ? "CONNECTING TO PLAYER"
                      : game.kind === "island" ? "ISLAND GAME OPEN" : "EXTERNAL PLAYER OPEN"
                    : "READY WHEN YOU ARE"}
                </span>
                <div>
                  <button onClick={enterFullscreen} disabled={!started}>
                    <ArrowsFullscreen aria-hidden="true" /> Fullscreen
                  </button>
                  <a href={game.url} target="_blank" rel="noreferrer">
                    <BoxArrowUpRight aria-hidden="true" /> Open separately
                  </a>
                </div>
              </div>
              {notice && (
                <p className="secret-notice" role="status">
                  {notice}
                </p>
              )}
            </section>
            <button
              className="secret-carousel-arrow carousel-next"
              aria-label="Next game"
              onClick={() => selectGame(gameIndex + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <div className="secret-carousel-caption">
              <span role="status" aria-live="polite">
                {game.name}
              </span>
              <p>Switching games reloads the player.</p>
            </div>
            <section
              className="secret-library"
              aria-labelledby="cartridge-heading"
            >
              <h2 id="cartridge-heading">Choose a cartridge</h2>
              <div
                className="game-cartridge-grid"
                role="group"
                aria-label="Choose a game"
              >
                {games.map((item, index) => (
                  <GameCartridge
                    key={item.id}
                    game={item}
                    selected={index === gameIndex}
                    action="Select"
                    onSelect={() => selectGame(index)}
                  />
                ))}
              </div>
            </section>
          </div>
          <aside className="secret-sidebar">
            <section className="secret-control-card">
              <div className="secret-controls-heading">
                <span className="glass-eyebrow">THE BASICS</span>
                <h2>Take the controls.</h2>
                <p>{game.kind === "island" ? game.controls : "Click inside the game first. Its Controls Settings lists additional buttons."}</p>
              </div>
              {game.kind !== "island" && <dl>
                <div>
                  <dt>Move</dt>
                  <dd>
                    <kbd>↑</kbd>
                    <kbd>←</kbd>
                    <kbd>↓</kbd>
                    <kbd>→</kbd>
                  </dd>
                </div>
                <div>
                  <dt>A button</dt>
                  <dd>
                    <kbd>Z</kbd>
                  </dd>
                </div>
                <div>
                  <dt>B button</dt>
                  <dd>
                    <kbd>X</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Start</dt>
                  <dd>
                    <kbd>Enter</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Select</dt>
                  <dd>
                    <kbd>Shift</kbd>
                  </dd>
                </div>
              </dl>}
            </section>
            <section className="secret-story">
              <span>WHY A GAME?</span>
              <p>
                My first coding experiment let my betta fish, Vendetta, play
                Pokémon. This little corner is a nod to where it all started.
              </p>
              <HashLink to={returnUrl}>Back to Vendetta’s project ↗</HashLink>
            </section>
            <details className="secret-help">
              <summary>Player not responding?</summary>
              <p>
                Click or tap inside the player to give it focus. If it still
                won’t load, try “Open separately.”
                {game.kind !== "island" && " If it reports a graphics error, try a browser with graphics acceleration enabled. Availability and touch controls depend on the external player."}
              </p>
            </details>
          </aside>
        </div>
        <footer className="secret-footer">
          <span>GOOD THINGS HIDE IN THE DETAILS.</span>
          <HashLink to={returnUrl}>
            Back to the main quest <ArrowLeft aria-hidden="true" />
          </HashLink>
        </footer>
      </main>
    </div>
  );
}
