import { useEffect, useRef } from "react";
import SpritePose from "./SpritePose";
import useDialogFocus from "../hooks/useDialogFocus";
import "./activities.css";
// Each visit waits for an explicit start. No timer or Escape shortcut dismisses
// the greeting while someone is reading it or waiting for artwork to load.
export default function Welcome({ ready, onClose }) {
  const button = useRef(null),
    panel = useRef(null);
  useDialogFocus(panel, null);
  useEffect(() => {
    if (ready) button.current?.focus();
  }, [ready]);
  return (
    <section
      ref={panel}
      tabIndex={-1}
      className="world-welcome"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to my world"
    >
      <div className="welcome-orbit" aria-hidden="true">
        <span>✦</span>
        <span>✧</span>
      </div>
      <small>A LITTLE WORK. A LITTLE WONDER.</small>
      <h1>
        Welcome to
        <br />
        <em>my world.</em>
      </h1>
      <div className="welcome-avatar">
        <SpritePose
          asset="masyn-wave"
          scale={3}
          label="Masyn welcomes you to the island"
        />
      </div>
      <p>
        Meet the family. Explore my work.
        <br />
        Take the scenic route.
      </p>
      <button ref={button} onClick={onClose} disabled={!ready}>
        {ready ? "Let’s explore →" : "Preparing the island…"}
      </button>
    </section>
  );
}
