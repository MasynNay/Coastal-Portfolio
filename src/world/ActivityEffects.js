import { drawAbility } from "./AbilityEffects";
// Small effects share the scene projection and simulation clock. They pause with
// dialogs and never need independent animation loops or background timers.
export function drawActivities(ctx, at, unit, state) {
  ctx.save();
  for (const web of state.webEffects || []) {
    const t = Math.min(1, (state.worldTime - web.started) / 1000);
    const a = at(web.x, web.z - 0.9),
      b = at(
        web.x + web.dx * 2.2 * Math.min(1, t * 4),
        web.z + web.dz * 2.2 * Math.min(1, t * 4) - 0.9,
      );
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = "#f5fbff";
    ctx.lineWidth = Math.max(1, unit * 0.035);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const r = unit * 0.3 * Math.min(1, t * 5);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + Math.cos(angle) * r, b.y + Math.sin(angle) * r);
      ctx.stroke();
    }
    for (const scale of [0.5, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.lineTo(
          b.x + Math.cos(angle) * r * scale,
          b.y + Math.sin(angle) * r * scale,
        );
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const play = state.dogPlay;
  if (play && !play.done) {
    const p = at(play.player.x, play.player.z - 0.85),
      d = at(play.dog.x, play.dog.z - 0.35);
    if (play.leash) {
      ctx.strokeStyle = "#d5b181";
      ctx.lineWidth = Math.max(1, unit * 0.055);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(
        (p.x + d.x) / 2,
        Math.max(p.y, d.y) + unit * 0.4,
        d.x,
        d.y,
      );
      ctx.stroke();
    }
    if (play.ball) {
      const b = at(play.ball.x, play.ball.z);
      ctx.fillStyle = "#132f2b44";
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, unit * 0.13, unit * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      const y = b.y - (play.ball.lift + 0.15) * unit;
      ctx.fillStyle = "#d7f45b";
      ctx.beginPath();
      ctx.arc(b.x, y, unit * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fcffdc";
      ctx.lineWidth = Math.max(1, unit * 0.025);
      ctx.beginPath();
      ctx.arc(b.x - unit * 0.08, y, unit * 0.13, -1, 1);
      ctx.stroke();
    }
    if (play.hearts) {
      ctx.fillStyle = "#ffafbf";
      ctx.font = `${Math.round(unit * 0.45)}px sans-serif`;
      ctx.fillText(
        "♥",
        d.x - unit * 0.2,
        d.y - unit * (0.6 + (state.worldTime % 800) / 1200),
      );
    }
  }
  const yoyo = state.abilityEffect;
  if (yoyo?.kind === "yoyo" && state.worldTime - yoyo.started < 1100) {
    const t = (state.worldTime - yoyo.started) / 1100,
      reach = Math.sin(t * Math.PI) * 2.5;
    const a = at(yoyo.x, yoyo.z - 0.9),
      b = at(yoyo.x + yoyo.dx * reach, yoyo.z + yoyo.dz * reach - 0.9);
    ctx.strokeStyle = "#f4e9ce";
    ctx.lineWidth = Math.max(1, unit * 0.035);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillStyle = "#e54951";
    ctx.beginPath();
    ctx.arc(b.x, b.y, unit * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#372d39";
    ctx.lineWidth = Math.max(1, unit * 0.04);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + t * 20;
      ctx.fillStyle = "#282936";
      ctx.beginPath();
      ctx.arc(
        b.x + Math.cos(angle) * unit * 0.1,
        b.y + Math.sin(angle) * unit * 0.1,
        unit * 0.035,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  if (!state.salute)
    drawAbility(ctx, at, unit, state.abilityEffect, state.worldTime);
  const duck = state.duckPlay;
  if (duck && !duck.done) {
    for (const member of duck.members || [{ duck: duck.duck }]) {
      const d = at(member.duck.x, member.duck.z);
      if (duck.hearts) {
        ctx.fillStyle = "#ffafbf";
        ctx.font = `${Math.round(unit * 0.42)}px sans-serif`;
        ctx.fillText(
          "♥",
          d.x - unit * 0.18,
          d.y - unit * (1.2 + (state.worldTime % 800) / 1400),
        );
      }
      if (duck.peas) {
        const from = at(duck.player.x, duck.player.z - 0.85);
        for (let i = 0; i < 5; i++) {
          const t = Math.max(0, Math.min(1, (duck.elapsed - i * 180) / 700));
          if (duck.elapsed < i * 180 || duck.elapsed > 1450 + i * 100) continue;
          const x = from.x + (d.x - from.x) * t + (i - 2) * unit * 0.075 * t,
            y =
              from.y + (d.y - from.y) * t - Math.sin(t * Math.PI) * unit * 0.7;
          ctx.fillStyle = "#9ddb5e";
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1.4, unit * 0.065), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#d8f4b1";
          ctx.fillRect(
            x - unit * 0.02,
            y - unit * 0.035,
            Math.max(1, unit * 0.025),
            Math.max(1, unit * 0.025),
          );
        }
      }
    }
  }
  ctx.restore();
}
