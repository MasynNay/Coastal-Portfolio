import { abilityActive, abilityProjectile } from "./Abilities";
import { glideVisual } from "./Glide";

// Lightweight props and particles extend the hand-drawn action sheets. All
// effects use the world's paused clock; nothing survives travel or a skin change.
export function drawAbility(ctx, at, unit, effect, time) {
  if (!abilityActive(effect, time) || !effect.asset) return;
  const age = time - effect.started;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const glide = glideVisual(effect, time);
  if (glide && glide.lift > 0.1) {
    const p = at(glide.x, glide.z);
    ctx.strokeStyle = "#d8f4eb88";
    ctx.lineWidth = Math.max(1, unit * 0.035);
    for (let i = 0; i < 3; i++) {
      const t = ((age + i * 180) % 800) / 800;
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y - unit * (glide.lift + 0.5 + t * 0.4),
        unit * (0.4 + t * 0.55),
        unit * 0.14,
        t * 0.3,
        0,
        Math.PI * 1.55,
      );
      ctx.stroke();
    }
  }
  if (effect.kind === "ocarina" && age >= 400 && age < 1800) {
    for (let i = 0; i < 5; i++) {
      const t = (age - 400 - i * 180) / 1100;
      if (t < 0 || t > 1) continue;
      const p = at(effect.x, effect.z);
      ctx.globalAlpha = Math.sin(t * Math.PI);
      ctx.fillStyle = ["#86dff2", "#f1dfa2", "#c2b4ef"][i % 3];
      ctx.font = `bold ${Math.round(unit * 0.46)}px serif`;
      ctx.fillText(
        i % 2 ? "♫" : "♪",
        p.x + unit * (0.4 + Math.sin(t * 3 + i) * 0.6),
        p.y - unit * (1.65 + t * 1.4),
      );
    }
  }
  if (effect.kind === "spell" && age >= 550 && age < 1350) {
    for (let i = 0; i < 12; i++) {
      const t = (age - 550 - i * 35) / 460;
      if (t < 0 || t > 1) continue;
      const reach = 0.7 + t * 3.5;
      const p = at(effect.x + effect.dx * reach, effect.z + effect.dz * reach);
      p.x += Math.sin(t * 8 + i) * unit * 0.2;
      p.y -= unit * (1.15 + Math.cos(t * 8 + i) * 0.2);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = i % 2 ? "#d8f8ff" : "#78c9f5";
      const size = Math.max(2, unit * 0.12 * (1 - t / 2));
      ctx.fillRect(Math.round(p.x - size), Math.round(p.y), size * 2, size / 2);
      ctx.fillRect(Math.round(p.x), Math.round(p.y - size), size / 2, size * 2);
    }
  }
  if (effect.kind === "money") {
    for (let i = 0; i < 7; i++) {
      const t = (age - 450 - i * 65) / 850;
      if (t < 0 || t > 1) continue;
      const side = ((i % 3) - 1) * 0.4,
        reach = 0.45 + t * 2.3;
      const p = at(
        effect.x + effect.dx * reach + effect.dz * side,
        effect.z + effect.dz * reach - effect.dx * side,
      );
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - t) * 4);
      ctx.translate(p.x, p.y - unit * (1.2 + Math.sin(t * Math.PI) * 0.8));
      ctx.rotate(Math.sin(t * 9 + i) * 0.5);
      ctx.fillStyle = "#9ecb83";
      ctx.strokeStyle = "#356e51";
      ctx.lineWidth = 1;
      ctx.fillRect(-unit * 0.19, -unit * 0.09, unit * 0.38, unit * 0.18);
      ctx.strokeRect(-unit * 0.19, -unit * 0.09, unit * 0.38, unit * 0.18);
      ctx.fillStyle = "#356e51";
      ctx.font = `bold ${Math.max(8, unit * 0.17)}px serif`;
      ctx.textAlign = "center";
      ctx.fillText("$", 0, unit * 0.06);
      ctx.restore();
    }
  }
  const projectile = abilityProjectile(effect, time);
  if (projectile) {
    const p = at(projectile.x, projectile.z);
    ctx.globalAlpha = projectile.alpha;
    ctx.translate(p.x, p.y - unit * (1.08 + projectile.lift));
    ctx.scale(unit, unit);
    if (effect.kind === "pokeball") {
      ctx.rotate(projectile.t * Math.PI * 4);
      ctx.fillStyle = "#ec4958";
      ctx.beginPath();
      ctx.arc(0, 0, 0.17, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#f5f3e8";
      ctx.beginPath();
      ctx.arc(0, 0, 0.17, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#253745";
      ctx.lineWidth = 0.035;
      ctx.beginPath();
      ctx.arc(0, 0, 0.17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.17, 0);
      ctx.lineTo(0.17, 0);
      ctx.stroke();
      ctx.fillStyle = "#fff9e5";
      ctx.beginPath();
      ctx.arc(0, 0, 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.rotate(Math.atan2(effect.dz, effect.dx));
      ctx.strokeStyle = effect.kind === "trident" ? "#f1cb6f" : "#b98553";
      ctx.lineWidth = effect.kind === "trident" ? 0.065 : 0.04;
      ctx.beginPath();
      ctx.moveTo(-0.5, 0);
      ctx.lineTo(0.45, 0);
      ctx.stroke();
      if (effect.kind === "trident") {
        ctx.beginPath();
        ctx.moveTo(0.16, -0.21);
        ctx.lineTo(0.16, 0.21);
        ctx.stroke();
        for (const y of [-0.21, 0, 0.21]) {
          ctx.beginPath();
          ctx.moveTo(0.16, y);
          ctx.lineTo(y ? 0.38 : 0.52, y);
          ctx.stroke();
        }
        ctx.fillStyle = "#66d9d0";
        ctx.fillRect(-0.17, -0.06, 0.1, 0.12);
      } else {
        ctx.fillStyle = "#f0ead4";
        ctx.beginPath();
        ctx.moveTo(0.55, 0);
        ctx.lineTo(0.32, -0.11);
        ctx.lineTo(0.32, 0.11);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#d4e4c4";
        for (const y of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(-0.28, 0);
          ctx.lineTo(-0.45, y * 0.12);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}
