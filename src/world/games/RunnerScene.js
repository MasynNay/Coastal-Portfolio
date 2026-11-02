import { artwork, drawSprite } from "../art";
import { drawRunnerTrack, drawRunnerCoin, projectRunner } from "./RunnerTrack";
// Temple scenery, illustrated obstacles and costumes share the world's art cache.
// The distant temple stays calm while the perspective floor moves underneath.
export function drawRunner(ctx, cache, state, asset, time) {
  const W = 600,
    H = 700,
    bottom = 620;
  const backdrop = cache.get("runner-temple");
  ctx.fillStyle = "#547778";
  ctx.fillRect(0, 0, W, H);
  if (backdrop) ctx.drawImage(backdrop, 0, 0, W, H);
  drawRunnerTrack(ctx, cache.get("runner-floor"), state.distance);
  function sprite(
    id,
    x,
    y,
    height,
    direction = 0,
    moving = false,
    clock = time,
  ) {
    const image = cache.get(id);
    if (image && artwork[id])
      drawSprite(
        ctx,
        image,
        artwork[id],
        x,
        y,
        height,
        direction,
        moving,
        clock,
      );
  }
  const objects = state.objects
    .filter((o) => !o.checked)
    .slice()
    .sort((a, b) => b.at - a.at);
  for (const object of objects) {
    const ahead = object.at - state.distance;
    if (ahead > 80 || ahead < -2) continue;
    const p = projectRunner(object.lane, ahead),
      s = p.scale;
    if (object.kind === "coin")
      drawRunnerCoin(ctx, p.x, p.y, s, time, object.id);
    else if (["air", "water", "fire", "earth"].includes(object.kind)) {
      ctx.save();
      ctx.shadowBlur = 16 * s;
      ctx.shadowColor = {
        air: "#c4efdc",
        water: "#74daec",
        fire: "#efbd78",
        earth: "#b5d28a",
      }[object.kind];
      sprite(
        "runner-" + object.kind,
        p.x,
        p.y - 20 * s + Math.sin(time / 250 + object.id) * 4 * s,
        92 * s,
      );
      ctx.restore();
    } else
      // Larger silhouettes remain readable on the narrow phone canvas. This
      // changes presentation only; lane spacing and jump/slide timing stay put.
      sprite(
        "runner-" + object.kind,
        p.x,
        p.y,
        (object.kind === "arch" ? 200 : object.kind === "rail" ? 92 : 112) * s,
      );
  }
  const p = projectRunner(state.visualLane),
    progress = state.jump ? 1 - state.jump / 0.9 : 0,
    jump = Math.sin(progress * Math.PI) * 100;
  ctx.fillStyle = "#17372c66";
  ctx.beginPath();
  ctx.ellipse(p.x, bottom + 3, 23 - jump * 0.08, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Airbending lifts each jump: curling white wind arcs circle below the feet.
  if (state.jump || state.shield) {
    ctx.save();
    ctx.translate(p.x, bottom - jump * 0.45);
    ctx.strokeStyle = state.shield ? "#d9f9e9bb" : "#e8fff3cc";
    ctx.lineWidth = 3;
    for (let n = 0; n < 4; n++) {
      const angle = time / 180 + n * 1.5,
        radius = 26 + n * 7;
      ctx.beginPath();
      ctx.ellipse(
        Math.sin(angle) * 8,
        -n * 7,
        radius,
        radius * 0.25,
        Math.sin(angle) * 0.08,
        angle,
        angle + Math.PI * 1.45,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  if (state.burst > 0) {
    ctx.save();
    ctx.globalAlpha = state.burst;
    const glow = ctx.createRadialGradient(
      p.x,
      bottom - 40,
      15,
      p.x,
      bottom - 140,
      300,
    );
    glow.addColorStop(0, "#f9d68a99");
    glow.addColorStop(1, "#ec5b2400");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.magnet > 0)
    sprite("runner-water-aura", p.x, bottom + 2, 148, 0, true, time);
  ctx.save();
  ctx.translate(p.x, bottom - jump);
  if (state.invulnerable > 0) ctx.globalAlpha = 0.7;
  const base = asset.replace(/-run$/, ""),
    pose = state.jump || state.duck ? base + "-board-trick" : asset;
  const poseClock = state.jump
    ? Math.min(7, Math.floor(progress * 8)) * 95
    : state.duck
      ? 95
      : time;
  const actorHeight =
    132 * ((artwork[pose]?.ch || 144) / (artwork[pose]?.bodyHeight || 96));
  sprite(pose, 0, 0, actorHeight, 4, !state.over, poseClock);
  ctx.restore();

  if (state.magnet > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x - 100, bottom - 35, 200, 45);
    ctx.clip();
    sprite("runner-water-aura", p.x, bottom + 2, 148, 0, true, time);
    ctx.restore();
  }
}
