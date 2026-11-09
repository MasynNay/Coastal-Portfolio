import { useRef } from "react";
import useDialogFocus from "../hooks/useDialogFocus";
import "./MacAppearance.css";

const preferenceKey = "masyn-mac-appearance";
// The same palette paints the swatch and the desktop, so each new option
// only needs one entry. Keep the IDs stable for saved preferences.
const wallpapers = {
  ocean: {
    name: "Coastal folds",
    paint: "linear-gradient(155deg, #6ea9a6, #214a65)",
  },
  dusk: {
    name: "Lavender dusk",
    paint: "linear-gradient(155deg, #605286, #292740 60%, #171627)",
  },
  forest: {
    name: "Fern canopy",
    paint: "linear-gradient(155deg, #4d8072, #203e36 58%, #102722)",
  },
  sunrise: {
    name: "Desert sunrise",
    paint: "linear-gradient(155deg, #8e5c51, #58384b 58%, #2a2134)",
  },
  aurora: {
    name: "Northern lights",
    paint:
      "radial-gradient(ellipse at 74% 18%, #40978a, transparent 61%), linear-gradient(145deg, #172f49 18%, #4b3972 70%, #132031)",
  },
  glacier: {
    name: "Glacier blue",
    paint:
      "radial-gradient(ellipse at 90% 8%, #648ca8, transparent 56%), linear-gradient(145deg, #354d76, #203952 64%, #132337)",
  },
  orchid: {
    name: "Wild orchid",
    paint: "linear-gradient(146deg, #77527e, #4e3564 47%, #252141)",
  },
  rose: {
    name: "Rosewater",
    paint:
      "radial-gradient(ellipse at 81% 12%, #ad6f86, transparent 55%), linear-gradient(145deg, #623b56, #442b4a 66%, #2d2037)",
  },
  ember: {
    name: "Ember glow",
    paint:
      "radial-gradient(ellipse at 84% 20%, #aa613e, transparent 57%), linear-gradient(155deg, #713c39, #46283d 56%, #261d2f)",
  },
  lagoon: {
    name: "Deep lagoon",
    paint: "linear-gradient(145deg, #287f79, #20515d 45%, #102c48)",
  },
  sand: {
    name: "Dune shadow",
    paint: "linear-gradient(148deg, #806b54, #554537 52%, #302b36)",
  },
  midnight: {
    name: "Midnight ink",
    paint:
      "radial-gradient(ellipse at 78% 8%, #414e73, transparent 57%), linear-gradient(160deg, #202c48, #161b2c 65%, #111424)",
  },
};

function metal(name, highlight, shade, edge) {
  return {
    name,
    paint: `linear-gradient(125deg, ${highlight}, ${shade})`,
    edge,
  };
}

const bezels = {
  silver: metal("Silver", "#f0f2f1", "#b5c3ca", "#576166"),
  mint: metal("Sea glass", "#c9f3e1", "#579f90", "#477b72"),
  violet: metal("Lilac", "#eee5ff", "#9985bc", "#766294"),
  graphite: metal("Graphite", "#8c99a0", "#485760", "#39464d"),
  pearl: metal("Pearl", "#fffaf0", "#dad3bf", "#8e8675"),
  pacific: metal("Pacific blue", "#b7d9f4", "#567eab", "#3d5d82"),
  roseGold: metal("Rose gold", "#f4d2ca", "#bf827d", "#9a615b"),
  champagne: metal("Champagne", "#f6e7c1", "#b8a06a", "#8c7649"),
  copper: metal("Copper", "#eac2a5", "#a56a4e", "#7d4e3c"),
  burgundy: metal("Burgundy", "#b8829b", "#703951", "#603044"),
  spruce: metal("Spruce", "#adcab7", "#4f7864", "#385b4b"),
  slateBlue: metal("Storm blue", "#a6b4cd", "#596a89", "#455371"),
};
export const defaultAppearance = { wallpaper: "ocean", bezel: "silver" };

export function appearanceStyle({ wallpaper, bezel }) {
  return {
    "--wallpaper-choice": wallpapers[wallpaper].paint,
    "--bezel-choice": bezels[bezel].paint,
    "--bezel-edge": bezels[bezel].edge,
  };
}

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
                {Object.entries(options).map(([id, { name, paint }]) => (
                  <label key={id}>
                    <input
                      type="radio"
                      name={key}
                      value={id}
                      checked={value[key] === id}
                      onChange={() => onChange({ ...value, [key]: id })}
                    />
                    <span
                      className="mac-appearance-swatch"
                      style={{ background: paint }}
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
