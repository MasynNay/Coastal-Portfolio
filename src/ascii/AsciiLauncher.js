import { useRef, useState } from "react";
import AsciiApp from "./AsciiStudio";
import { createPortal } from "react-dom";
import useDialogFocus from "../hooks/useDialogFocus";
import { sceneCategories } from "./Worlds";
import "./AsciiLauncher.css";

// The normal portfolio launches the same app as the Mac dock and room PC.
// Load the renderer only after opening, so the main page stays lightweight.
export default function AsciiLauncher() {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  return (
    <aside className="ascii-feature" aria-label="ASCII Studio">
      <pre aria-hidden="true">
        {"~ % ascii --explore\n\n  @@@   ><(((o>\n  /|\\    . * ."}
      </pre>
      <div>
        <span className="ascii-feature-kicker">AN INTERACTIVE EXPERIMENT</span>
        <h3>ASCII Studio</h3>
        <p>
          Flowers, living aquariums, familiar game worlds, and galaxies—all
          drawn with colored text. Pick a scene and spend a little time
          exploring.
        </p>
        <small>
          {sceneCategories.length + 1} collections ·{" "}
          {sceneCategories[0].scenes.length} scenes each
        </small>
      </div>
      <button ref={trigger} onClick={() => setOpen(true)}>
        Open ASCII Studio
      </button>
      {open &&
        createPortal(
          <AsciiModal onClose={() => setOpen(false)} trigger={trigger} />,
          document.body,
        )}
    </aside>
  );
}

function AsciiModal({ onClose, trigger }) {
  const panel = useRef(null);
  useDialogFocus(panel, onClose, trigger);
  return (
    <div className="ascii-modal-backdrop">
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="ASCII Studio"
        tabIndex={-1}
        className="ascii-modal"
      >
        <header className="ascii-modal-title">
          <span>ASCII Studio</span>
          <button onClick={onClose} aria-label="Close ASCII Studio">
            ×
          </button>
        </header>
        <div className="ascii-modal-body">
          <AsciiApp active />
        </div>
      </section>
    </div>
  );
}
