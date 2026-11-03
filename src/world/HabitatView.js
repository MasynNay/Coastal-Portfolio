import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Dialog from "./WorldDialog";

// The inspection surface and release control are sibling buttons. Nesting the
// release action inside the image button would also toggle zoom when tapped.
export default function HabitatView({
  name,
  aquatic = false,
  inspecting,
  paused,
  onInspect,
  onRelease,
  children,
}) {
  const [confirming, setConfirming] = useState(false);
  const releaseButton = useRef(null);
  return (
    <div
      className={`habitat-view ${aquatic ? "aquatic-view" : ""} ${inspecting ? "is-close" : ""}`}
    >
      <button
        className={`${aquatic ? "aquarium-tank" : "spider-habitat"} ${inspecting ? "is-close" : ""} ${paused ? "is-paused" : ""}`}
        aria-label={`Inspect ${name}`}
        aria-pressed={inspecting}
        onClick={onInspect}
      >
        {children}
      </button>
      <button
        className="habitat-zoom"
        aria-label={
          inspecting ? `Back to ${name}'s habitat` : `Look closer at ${name}`
        }
        aria-pressed={inspecting}
        onClick={onInspect}
      >
        {inspecting
          ? `− Back to ${aquatic ? "aquarium" : "habitat"}`
          : "+ Look closer"}
      </button>
      {onRelease && (
        <button
          className="habitat-release"
          ref={releaseButton}
          aria-label={`Release one ${name}`}
          onClick={() => setConfirming(true)}
        >
          Release One
        </button>
      )}
      {confirming &&
        createPortal(
          <Dialog
            title="Release into the wild?"
            className="release-confirmation"
            scrimClassName="world-confirmation-overlay"
            returnFocusRef={releaseButton}
            onClose={() => setConfirming(false)}
          >
            <p>
              Are you sure you want to release one <strong>{name}</strong> into
              the wild?
            </p>
            <p>Your field guide discovery will stay saved.</p>
            <div className="activity-actions">
              <button onClick={() => setConfirming(false)}>Cancel</button>
              <button
                onClick={() => {
                  setConfirming(false);
                  onRelease();
                }}
              >
                Release One
              </button>
            </div>
          </Dialog>,
          document.body,
        )}
    </div>
  );
}
