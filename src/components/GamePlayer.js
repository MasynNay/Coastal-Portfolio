import { useId, useRef, useState } from "react";
import { ArrowsFullscreen } from "react-bootstrap-icons";
import RomDownload from "./RomDownload";
import "./GamePlayer.css";
// An isolated player is shared by Mac windows and the Lodge. Unmounting it
// unloads the iframe; controls, downloads and fullscreen behave identically.
export default function GamePlayer({ game }) {
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
      setNotice(
        "Fullscreen isn’t available here. Open the game separately for more room.",
      );
    }
  }
  return (
    <div
      className={`mac-games mac-game-player${game.largePlayer ? " mac-game-player-expanded" : ""}`}
    >
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
          <RomDownload file={game.download} />
        </div>
        <a href={game.url} target="_blank" rel="noreferrer">
          Open game separately ↗
        </a>
      </div>
      <aside id={controlsId} hidden={!legend} className="mac-controls">
        <strong>Take the controls</strong>
        {game.controls ? (
          <p>{game.controls}</p>
        ) : (
          <>
            <p>Arrows: move · Z / X: A / B · Enter: Start · Shift: Select.</p>
            <p>
              On phones and tablets, use the player’s touch controls. Check its
              settings if the bindings differ.
            </p>
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
        src={
          game.largePlayer
            ? `${game.url}${game.url.includes("?") ? "&" : "?"}view=mac`
            : game.url
        }
        title={game.name}
        allowFullScreen
        allow="gamepad; fullscreen; cross-origin-isolated"
      />
    </div>
  );
}
