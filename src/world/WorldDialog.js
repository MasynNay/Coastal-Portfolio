import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus";

// WorldMode pauses the simulation; this panel owns dismissal, focus and room content.
export default function Dialog({
  title,
  children,
  onClose,
  wide = false,
  className = "",
}) {
  const ref = useRef(null);
  useDialogFocus(ref, onClose);
  return (
    <div
      className="world-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={
          "world-dialog" + (wide ? " world-dialog-wide" : "") + " " + className
        }
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <header>
          <div>
            <small>A ROOM WITH A STORY</small>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </header>
        <div className="world-dialog-body">{children}</div>
      </section>
    </div>
  );
}
