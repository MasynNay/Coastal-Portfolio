import {
  fireClearTime,
  runnerJumpTime,
  runnerJumpHeight,
  runnerSlideAmount,
} from "./Runner";
import { drawMagnetCoin, drawTrackCoin } from "./RunnerCoins";
import { artwork, drawSprite } from "../art";
import { drawRunnerTrack, runnerView, runnerCamera } from "./RunnerTrack";
import {
  drawBurningObstacle,
  drawPowerPickup,
  drawRunnerAura,
  drawRunnerCast,
  runnerPowerColor,
} from "./RunnerEffects";

const powerKinds = new Set(["air", "water", "fire", "earth"]);

// The temple is a distant landmark. The bridge, props and coins all advance
// along the same world-space track beneath it.
export function drawRunner(ctx, cache, state, asset) {
  const time = state.elapsed * 1000,
    bottom = runnerCamera.feet;
  const backdrop = cache.get("runner-temple");
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#547778";
  ctx.fillRect(0, 0, 600, 700);
  const view = runnerView(state.distance, state.visualLane);
  if (backdrop) {
    const pan = (view(1, 40).x - runnerCamera.center) * 0.11;
    ctx.drawImage(backdrop, -31 + pan, -11, 662, 722);
  }
  drawRunnerTrack(ctx, state.distance, view);

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

  const rider = view(state.visualLane);
  const jump = runnerJumpHeight(state),
    slide = runnerSlideAmount(state);
  const feet = bottom - jump;
  const objects = state.objects
    .filter((o) => o.at - state.distance <= 80)
    .sort((a, b) => b.at - a.at);
  for (const object of objects) {
    if (object.drawnAt != null) continue;
    const p = view(object.lane, object.at - state.distance);
    const s = p.scale;
    if (object.kind === "coin") {
      drawTrackCoin(ctx, object, view, state);
    } else if (powerKinds.has(object.kind)) {
      const y = p.y - 20 * s + Math.sin(time / 250 + object.id) * 4 * s;
      drawPowerPickup(ctx, object.kind, p.x, y - 23 * s, s, state.elapsed);
      ctx.fillStyle = runnerPowerColor(object.kind);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1, 11 * s, 3 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      sprite("runner-" + object.kind, p.x, y, 92 * s);
    } else {
      const burn =
        object.burningAt == null
          ? 0
          : (state.elapsed - object.burningAt) / fireClearTime;
      ctx.save();
      ctx.globalAlpha = 1 - burn;
      ctx.fillStyle = "#171f2f79";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 2, 48 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      sprite(
        "runner-" + object.kind,
        p.x,
        p.y - burn * 38 * s,
        (object.kind === "arch" ? 200 : object.kind === "rail" ? 92 : 112) * s,
      );
      ctx.restore();
      if (burn > 0) drawBurningObstacle(ctx, p.x, p.y - 32 * s, s, burn);
    }
  }

  ctx.fillStyle = "#17372c66";
  ctx.beginPath();
  ctx.ellipse(rider.x, bottom + 3, 23 - jump * 0.08, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  drawRunnerAura(ctx, state, rider.x, feet, false);
  if (slide > 0.05) {
    // Streaks stretch behind the rider, giving the low pose a sense of travel.
    ctx.save();
    ctx.strokeStyle = "#e5ebd8aa";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const trail = ((state.distance * 28 + i * 13) % 46) * slide;
      const x = rider.x + (i - 2.5) * 12;
      ctx.beginPath();
      ctx.moveTo(x, bottom + trail);
      ctx.lineTo(x + (i - 2.5) * 4, bottom + trail + 12 * slide);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.translate(rider.x, feet);
  ctx.scale(1 + slide * 0.1, 1 - slide * 0.48);
  ctx.rotate((state.lane - state.visualLane) * 0.14);
  if (state.invulnerable > 0) ctx.globalAlpha = 0.7;
  const base = asset.replace(/-run$/, "");
  const pose = state.jump || state.duck ? base + "-board-trick" : asset;
  const progress = state.jump ? 1 - state.jump / runnerJumpTime : 0;
  const poseClock = state.jump
    ? Math.min(7, Math.floor(progress * 8)) * 95
    : state.duck
      ? 190
      : time;
  const actorHeight =
    132 * ((artwork[pose]?.ch || 144) / (artwork[pose]?.bodyHeight || 96));
  sprite(pose, 0, 0, actorHeight, 4, !state.over, poseClock);
  ctx.restore();
  drawRunnerAura(ctx, state, rider.x, feet, true);
  drawRunnerCast(ctx, state, rider.x, feet);
  for (const coin of objects) {
    if (coin.drawnAt != null)
      drawMagnetCoin(ctx, coin, view, rider, feet, state.elapsed);
  }
}
