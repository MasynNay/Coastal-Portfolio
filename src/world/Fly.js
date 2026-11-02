import { characterAsset } from "./Wardrobe";
// Gen-3-inspired timing: turn, swoop, capture, fade, descend, release, bird departure.
// Values are normalized screen offsets, so zoom changes do not stretch the flight path.
export const flyDepartureMs = 1700,
  flyArrivalMs = 1900;
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
export function flightFrame(mode, elapsed) {
  elapsed = Math.max(0, elapsed);
  const t = clamp(elapsed / (mode === "out" ? flyDepartureMs : flyArrivalMs));
  const frame = {
    phase: "turn",
    player: true,
    direction: Math.floor(elapsed / 75) % 8,
    bird: false,
    x: 0,
    y: 0,
    angle: 0,
    fade: 0,
    shadow: 1,
  };
  if (mode === "out") {
    if (t < 0.22) return frame;
    frame.bird = true;
    if (t < 0.52) {
      const p = smooth((t - 0.22) / 0.3);
      frame.phase = "pickup";
      frame.x = (1 - p) * 1.15;
      frame.y = -Math.sin(p * Math.PI) * 0.32;
      frame.angle = -p * Math.PI * 0.6;
    } else {
      const p = smooth((t - 0.52) / 0.48);
      frame.phase = "takeoff";
      frame.player = false;
      frame.x = -0.12 * Math.sin(p * Math.PI);
      frame.y = -p * 1.2;
      frame.angle = -p * Math.PI * 1.5;
      frame.fade = smooth((t - 0.78) / 0.22);
      frame.shadow = 1 - p;
    }
  } else {
    frame.fade = 1 - smooth(t / 0.23);
    frame.bird = true;
    frame.player = false;
    if (t < 0.62) {
      const p = smooth(t / 0.62);
      frame.phase = "landing";
      frame.x = -(1 - p) * 1.1;
      frame.y = -Math.sin(((1 - p) * Math.PI) / 2) * 0.75;
      frame.angle = (1 - p) * Math.PI * 1.5;
      frame.shadow = p;
    } else {
      const p = smooth((t - 0.62) / 0.38);
      frame.phase = "release";
      frame.player = true;
      frame.direction = p < 0.45 ? Math.floor(elapsed / 75) % 8 : 0;
      const departure = smooth((t - 0.74) / 0.26);
      frame.x = departure * 1.2;
      frame.y = -Math.sin(departure * Math.PI) * 0.3;
      frame.angle = (-departure * Math.PI) / 4;
    }
  }
  return frame;
}

// Custom outfits stay on during every travel phase. Their upper-body artwork is
// layered onto the same duck, so flight never falls back to a different costume.
export function flightAppearance(character, outfit) {
  const body = characterAsset(character, outfit),
    layered = true;
  return {
    body,
    layered,
    call: layered ? body : character + "-call",
    land: layered ? body : character + "-land",
    rider: layered ? body : character + "-ride",
  };
}
