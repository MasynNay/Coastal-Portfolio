import { imageSource } from "./ImageSource";
import { useEffect, useState } from "react";
import { artwork as sheets } from "./art";
import { spriteFrame } from "./animation";
// UI previews use exactly the same shipped atlas and frame mapping as the walking game.
export default function SpritePose({
  asset = "masyn",
  direction = 0,
  playing = true,
  playbackRate = 1,
  scale = 3,
  frame = null,
  label = "Character sprite",
}) {
  const [time, setTime] = useState(0);
  const sheet =
    sheets[asset] ||
    sheets[asset.replace(/-(run|fish|surf|call|ride|land|emote)$/, "")] ||
    sheets.masyn;
  useEffect(() => setTime(0), [asset]);
  // Keep UI preview sizes stable when a source atlas gains detail.
  if (sheet.detailVersion) scale /= sheet.detailScale || 2;
  useEffect(() => {
    if (!playing) return;
    const step = Math.min(50, sheet.frameMs || 50);
    const timer = setInterval(
      () => setTime((t) => t + step * playbackRate),
      step,
    );
    return () => clearInterval(timer);
  }, [playing, sheet.frameMs, playbackRate]);
  const pose = spriteFrame(sheet, direction, playing || frame !== null, time),
    column = frame ?? pose.column;
  const previewWidth = sheet.previewWidth || sheet.cw;
  // Match the walking renderer's head alignment in dock/picker/workshop previews.
  // Other actions retain their full prop canvas rather than sliding a rod or mount.
  const align = ["walk", "run"].includes(sheet.action)
    ? (sheet.cw / 2 -
        (sheet.anchors?.[pose.row * (sheet.columns || 4) + column] ??
          sheet.cw / 2)) *
      scale
    : 0;
  const background = {
    backgroundImage: `url(${imageSource(sheet)})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${sheet.cw * (sheet.columns || 4) * scale}px ${sheet.ch * (sheet.rows || 8) * scale}px`,
    backgroundPosition: `${-column * sheet.cw * scale + align + ((previewWidth - sheet.cw) * scale) / 2}px ${-pose.row * sheet.ch * scale}px`,
  };
  // Pixel-art previews use the same crisp policy as the walking renderer.
  // Only illustrated, non-pixel art needs the legacy edge-coverage layers.
  const layered = sheet.opaqueBody && !sheet.pixelArt;
  const rendering = sheet.pixelArt || !sheet.smooth ? "pixelated" : "auto";
  const layer = { ...background, position: "absolute", inset: 0 };
  return (
    <span
      role="img"
      aria-label={label}
      className="sprite-pose"
      style={{
        display: "inline-block",
        width: previewWidth * scale,
        height: sheet.ch * scale,
        ...(layered ? { position: "relative" } : background),
        imageRendering: rendering,
        transform: pose.flip ? "scaleX(-1)" : undefined,
      }}
    >
      {layered && (
        <>
          <span
            aria-hidden="true"
            style={{ ...layer, imageRendering: "pixelated" }}
          />
          <span
            aria-hidden="true"
            style={{
              ...layer,
              imageRendering: rendering,
            }}
          />
        </>
      )}
    </span>
  );
}
