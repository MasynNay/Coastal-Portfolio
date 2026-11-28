import { useState } from "react";
import SpritePose from "./SpritePose";
import appearances from "./Appearances.json";
import { artwork } from "./art";
const directions = [
  "South",
  "Southeast",
  "East",
  "Northeast",
  "North",
  "Northwest",
  "West",
  "Southwest",
];
// A stable visual reference: both actions use the real shipped sheets and the
// same measured body height. Slow playback helps spot bad hands or a wrong row
// without changing anyone's artwork or disguising a defect with blended bodies.
export default function AnimationReview() {
  const [asset, setAsset] = useState("masyn"),
    [direction, setDirection] = useState(0),
    [speed, setSpeed] = useState(0.5),
    [playing, setPlaying] = useState(true);
  const base = artwork[asset],
    height = 160;
  const scale =
    (height / (base.bodyHeight || base.ch)) * (base.detailScale || 1);
  return (
    <section className="animation-review">
      <h3>Character Motion Studio</h3>
      <p>
        Everyday Masyn is the reference. Compare walking and running at the same
        body size, in all eight directions.
      </p>
      <div className="animation-review-controls">
        <label>
          Appearance
          <select value={asset} onChange={(e) => setAsset(e.target.value)}>
            {appearances
              .filter((o) => artwork[o.asset])
              .map((o) => (
                <option key={o.asset} value={o.asset}>
                  {o.character === "masyn" ? "Masyn · " : ""}
                  {o.outfitName || o.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Facing
          <select
            value={direction}
            onChange={(e) => setDirection(Number(e.target.value))}
          >
            {directions.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Playback
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value="0.25">Quarter Speed</option>
            <option value="0.5">Half Speed</option>
            <option value="1">Game Speed</option>
          </select>
        </label>
      </div>
      <div className="animation-review-stage">
        {["walk", "run"].map((action) => (
          <div key={action}>
            <SpritePose
              asset={asset + (action === "run" ? "-run" : "")}
              direction={direction}
              playing={playing}
              scale={scale}
              playbackRate={speed}
            />
            <strong>{action === "run" ? "Running" : "Walking"}</strong>
          </div>
        ))}
      </div>
      <button onClick={() => setPlaying(!playing)}>
        {playing ? "Pause Motion" : "Play Motion"}
      </button>
    </section>
  );
}
