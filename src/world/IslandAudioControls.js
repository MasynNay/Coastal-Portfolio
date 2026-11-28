import { useState } from "react";
import { readAudioSettings } from "./IslandAudio";
export default function IslandAudioControls({ onChange }) {
  const [settings, setSettings] = useState(readAudioSettings);
  function change(next) {
    setSettings(next);
    onChange(next);
  }
  return (
    <section className="island-audio-controls">
      <h3>Island Sound</h3>
      <p>
        Quiet ocean ambience, footsteps, and discovery chimes. Sound starts only
        when you enable it.
      </p>
      <button
        aria-pressed={settings.enabled}
        onClick={() => change({ ...settings, enabled: !settings.enabled })}
      >
        {settings.enabled ? "Sound On" : "Enable Sound"}
      </button>
      <label>
        Volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          onChange={(e) =>
            change({ ...settings, volume: Number(e.target.value) })
          }
        />
        <output>{Math.round(settings.volume * 100)}%</output>
      </label>
    </section>
  );
}
