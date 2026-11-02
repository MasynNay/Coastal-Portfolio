import { useEffect, useState } from "react";
import { imageSource } from "./ImageSource";
import art from "./CollectionArt.json";
import { artwork } from "./art";

// Large inspection drawings stay separate from map preloading. If a detailed
// image fails in a browser, retain the SAME species' map atlas instead of an
// empty enclosure. The hidden image observes real loading errors; CSS supplies
// the four-frame animation without per-resident React animation timers.
export default function CollectionSprite({ asset, label, paused = false }) {
  const [fallback, setFallback] = useState(false);
  useEffect(() => setFallback(false), [asset]);
  const map = artwork[asset],
    detail = art[asset];
  const sheet =
    fallback || !detail
      ? map && { ...map, width: map.cw, height: map.ch }
      : detail;
  if (!sheet)
    return (
      <span
        role="img"
        aria-label={label + " artwork unavailable"}
        className="collection-missing"
      >
        ◇
      </span>
    );
  const src = imageSource(sheet);
  return (
    <span
      role="img"
      aria-label={label}
      className={"collection-sprite" + (paused ? " is-paused" : "")}
      style={{
        backgroundImage: `url(${src})`,
        aspectRatio: `${sheet.width} / ${sheet.height}`,
        "--frame-time": `${(sheet.frameMs || 170) * 4}ms`,
      }}
    >
      <img
        className="collection-image-probe"
        src={src}
        alt=""
        onError={() => setFallback(true)}
      />
    </span>
  );
}
