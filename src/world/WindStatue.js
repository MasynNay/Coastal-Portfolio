import { activityAsset } from "./Wardrobe";
import sheets from "./SpriteSheets.json";
export const windSongDuration = 4200;
// A town interaction, separate from Q's costume power. Each wearer keeps their
// own full-body conducting drawing, including its illustrated hand-held baton.
export function startWindSong(actor, time) {
  return {
    kind: "conduct",
    asset: activityAsset(actor.id, actor.outfit, "conduct", sheets),
    x: actor.x,
    z: actor.z,
    direction: 0,
    started: time,
    duration: windSongDuration,
  };
}
export function conductFrame(time) {
  return Math.min(11, Math.floor(Math.max(0, time) / (windSongDuration / 12)));
}
// An original short bell melody, started only by E/tap on the statue. The
// browser may decline audio; the complete visible performance still plays.
export function playWindSong() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    const audio = new Audio();
    audio.resume().catch(() => {});
    const notes = [659.25, 783.99, 880, 783.99, 587.33, 659.25];
    notes.forEach((frequency, i) => {
      const at = audio.currentTime + 0.12 + i * 0.55,
        voice = audio.createOscillator(),
        volume = audio.createGain();
      voice.type = "sine";
      voice.frequency.value = frequency;
      volume.gain.setValueAtTime(0, at);
      volume.gain.linearRampToValueAtTime(0.12, at + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.001, at + 0.7);
      voice.connect(volume);
      volume.connect(audio.destination);
      voice.start(at);
      voice.stop(at + 0.75);
      if (i === notes.length - 1)
        voice.onended = () => audio.close().catch(() => {});
    });
  } catch {}
}
export function drawWindSong(ctx, at, unit, state, height) {
  const effect = state.abilityEffect;
  if (effect?.kind !== "conduct") return;
  const elapsed = state.worldTime - effect.started;
  if (elapsed < 0 || elapsed >= effect.duration) return;
  // The native full-body sheet contains the hands AND baton. This layer draws
  // only the melody notes; no detached instrument can rotate beside the actor.
  const point = at(effect.x, effect.z),
    x = point.x + height * unit * 0.2,
    y = point.y - height * unit * 0.6;
  ctx.save();
  ctx.font = `${Math.max(15, unit * 0.6)}px Georgia`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#dcfff1";
  ctx.shadowColor = "#407d8c";
  ctx.shadowBlur = 5;
  for (let i = 0; i < 3; i++) {
    const t = ((elapsed + i * 450) % 1700) / 1700;
    ctx.globalAlpha = Math.sin(t * Math.PI);
    ctx.fillText(
      i % 2 ? "♫" : "♪",
      x + Math.sin(t * 5 + i) * unit * 0.6,
      y - unit * (0.5 + t * 1.9),
    );
  }
  ctx.restore();
}
