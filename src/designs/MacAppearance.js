import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus";
import "./MacAppearance.css";

const preferenceKey = "masyn-mac-appearance";
const wallpapers = {
  ocean: "Coastal folds",
  dusk: "Lavender dusk",
  forest: "Fern canopy",
  sunrise: "Desert sunrise",
};
const bezels = {
  silver: "Silver",
  mint: "Sea glass",
  violet: "Lilac",
  graphite: "Graphite",
};
export const defaultAppearance = { wallpaper: "ocean", bezel: "silver" };

export function readAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey));
    return {
      wallpaper: Object.hasOwn(wallpapers, saved?.wallpaper)
        ? saved.wallpaper
        : defaultAppearance.wallpaper,
      bezel: Object.hasOwn(bezels, saved?.bezel)
        ? saved.bezel
        : defaultAppearance.bezel,
    };
  } catch {
    return defaultAppearance;
  }
}

export function saveAppearance(appearance) {
  try {
    localStorage.setItem(preferenceKey, JSON.stringify(appearance));
  } catch {
    // Appearance changes still work in a browser that blocks storage.
  }
}

export default function MacAppearance({
  value,
  onChange,
  onClose,
  returnFocusRef,
}) {
  const panel = useRef(null);
  useDialogFocus(panel, onClose, returnFocusRef);
  return (
    <div
      className="mac-about-scrim mac-appearance-scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="mac-about-panel mac-appearance-panel"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mac-appearance-title"
      >
        <header>
          <button
            className="mac-about-close"
            aria-label="Close Appearance"
            onClick={onClose}
          >
            ×
          </button>
          <span id="mac-appearance-title">Appearance</span>
        </header>
        <div className="mac-appearance-content">
          <p>Make this Mac yours. Your choices are saved on this device.</p>
          {[
            ["wallpaper", "Wallpaper", wallpapers],
            ["bezel", "Bezel color", bezels],
          ].map(([key, title, options]) => (
            <fieldset key={key}>
              <legend>{title}</legend>
              <div className="mac-appearance-options">
                {Object.entries(options).map(([id, name]) => (
                  <label key={id}>
                    <input
                      type="radio"
                      name={key}
                      checked={value[key] === id}
                      onChange={() => onChange({ ...value, [key]: id })}
                    />
                    <span
                      className="mac-appearance-swatch"
                      style={{ background: `var(--${id})` }}
                      aria-hidden="true"
                    />
                    {name}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={() => onChange(defaultAppearance)}>
            Restore defaults
          </button>
        </div>
      </section>
    </div>
  );
}
