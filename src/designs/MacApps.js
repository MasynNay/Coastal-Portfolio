import { useEffect, useId, useRef, useState } from "react";
import { games } from "../data/games";
import GameCartridge from "../components/GameCartridge";
import { photoAlbum } from "../data/photos";
import { ArrowsFullscreen } from "react-bootstrap-icons";
// The cartridge library shares the arcade catalog; each selection opens a Mac app window.
export function GamesApp({ onOpen }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="mac-games">
      <h2>Pocket Arcade</h2>
      <p>
        Choose a cartridge to open its game and controls in a new Mac window.
      </p>
      <div
        className="mac-game-picker game-cartridge-grid"
        role="group"
        aria-label="Choose a game"
      >
        {games.map((game) => (
          <GameCartridge
            key={game.id}
            game={game}
            selected={selected === game.id}
            onSelect={() => {
              setSelected(game.id);
              onOpen?.(game);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Each game owns a separate Mac window. Closing it unloads the external player;
// choosing the same cartridge restores that window instead of duplicating it.
export function GamePlayer({ game }) {
  const controlsId = useId(),
    controlsButton = useRef(null),
    player = useRef(null);
  const [legend, setLegend] = useState(!game.largePlayer);
  const [notice, setNotice] = useState("");
  async function fullscreen() {
    try {
      if (!player.current?.requestFullscreen) throw new Error("Unavailable");
      await player.current.requestFullscreen();
      player.current.focus();
      setNotice("");
    } catch {
      setNotice("Fullscreen isn’t available here. Open the game separately for more room.");
    }
  }
  return (
    <div className={`mac-games mac-game-player${game.largePlayer ? " mac-game-player-expanded" : ""}`}>
      <div className="mac-game-toolbar">
        <div className="mac-game-toolbar-actions">
        <button
          ref={controlsButton}
          aria-expanded={legend}
          aria-controls={controlsId}
          onClick={() => setLegend(!legend)}
        >
          {legend ? "Hide controls" : "Show controls"}
        </button>
        {game.largePlayer && (
          <button onClick={fullscreen} aria-label="Play fullscreen">
            <ArrowsFullscreen aria-hidden="true" />
            <span className="mac-fullscreen-label">Fullscreen</span>
          </button>
        )}
        </div>
        <a href={game.url} target="_blank" rel="noreferrer">
          Open game separately ↗
        </a>
      </div>
      <aside id={controlsId} hidden={!legend} className="mac-controls">
        <strong>Take the controls</strong>
        {game.kind === "island" ? <p>{game.controls}</p> : (
          <>
            <p>Arrows: move · Z / X: A / B · Enter: Start · Shift: Select.</p>
            <p>On phones and tablets, use the player’s touch controls. Check its settings if the bindings differ.</p>
          </>
        )}
        <button
          onClick={() => {
            setLegend(false);
            controlsButton.current?.focus();
          }}
        >
          Got it
        </button>
      </aside>
      {notice && <p role="status">{notice}</p>}
      <iframe
        ref={player}
        src={game.largePlayer ? `${game.url}?view=mac` : game.url}
        title={game.name}
        allowFullScreen
        allow="gamepad; fullscreen; cross-origin-isolated"
      />
    </div>
  );
}
// The shared album supplies its own responsive viewer and slideshow. Keeping it
// in an iframe avoids copying family photos or private photo metadata into Git.
export function PhotosApp({ active = true, album = photoAlbum }) {
  return album ? <SharedPhotos album={album} /> : <LocalPhotos active={active} />;
}

function SharedPhotos({ album }) {
  const [revision, setRevision] = useState(0);
  return (
    <section className="mac-photos mac-shared-photos" aria-label="Photo gallery">
      <header className="mac-photo-toolbar">
        <button onClick={() => setRevision((value) => value + 1)}>
          Refresh album
        </button>
        <a href={album.url} target="_blank" rel="noreferrer">
          Open album ↗
        </a>
      </header>
      <iframe
        key={revision}
        className="mac-photo-album"
        title={`${album.name} shared photo album`}
        src={album.url}
        allow="fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
    </section>
  );
}

// When no shared album is configured, the build-generated local index remains
// available for a self-contained gallery using public/slideshow images.
function LocalPhotos({ active = true }) {
  const [photos, setPhotos] = useState([]),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/slideshow/index.json")
      .then((r) => r.json())
      .then((list) => {
        if (live) setPhotos(list);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!active || !playing || photos.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % photos.length), 4000);
    return () => clearInterval(t);
  }, [active, playing, photos.length]);
  const swipe = useRef(null);
  return (
    <div className="mac-photos">
      <h2>Photos</h2>
      {photos.length ? (
        <>
          <img
            src={photos[index]}
            alt={`Slideshow item ${index + 1}`}
            draggable={false}
            onPointerDown={(e) => {
              swipe.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={(e) => {
              const start = swipe.current;
              swipe.current = null;
              if (
                !start ||
                Math.abs(e.clientX - start.x) < 45 ||
                Math.abs(e.clientY - start.y) > 60
              )
                return;
              setIndex(
                (i) =>
                  (i + (e.clientX < start.x ? 1 : -1) + photos.length) %
                  photos.length,
              );
            }}
            onPointerCancel={() => {
              swipe.current = null;
            }}
          />
          <div>
            <button
              onClick={() =>
                setIndex((index - 1 + photos.length) % photos.length)
              }
            >
              ← Previous
            </button>
            <button onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play slideshow"}
            </button>
            <button onClick={() => setIndex((index + 1) % photos.length)}>
              Next →
            </button>
          </div>
          <p>
            {index + 1} / {photos.length}
          </p>
        </>
      ) : (
        <p>
          Your photo album is ready. Add pictures to the slideshow folder, then
          restart the preview to load them.
        </p>
      )}
    </div>
  );
}
