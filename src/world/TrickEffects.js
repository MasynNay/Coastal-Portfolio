// Small props extend the authored character animations. The entire effect uses
// world time, so opening menus pauses the reaction and its route together.
export function drawTricks(ctx, at, unit, effects, heights) {
  ctx.save();
  for (const e of effects || []) {
    const p = at(e.x, e.z),
      age = e.age,
      h = heights(e.id);
    if (e.kind === "pokeball" && age >= 1130 && age < 2300) {
      const t = (age - 1130) / 1170;
      ctx.save();
      ctx.translate(
        p.x,
        p.y - unit * (0.18 + Math.abs(Math.sin(t * Math.PI * 4)) * 0.12),
      );
      ctx.rotate(Math.sin(t * Math.PI * 5) * 0.3);
      const r = unit * 0.2;
      ctx.lineWidth = Math.max(1, unit * 0.035);
      ctx.strokeStyle = "#24333e";
      ctx.fillStyle = "#eb4f57";
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#fff5df";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (e.kind === "arrow" && age < 2200) {
      const fly = Math.max(0, Math.min(1, (age - 1050) / 1000));
      ctx.save();
      ctx.translate(
        p.x + unit * fly * 1.8,
        p.y - unit * (h + 0.08 + Math.sin(fly * Math.PI) * 0.9),
      );
      ctx.rotate(fly * 4);
      ctx.globalAlpha = Math.min(1, (1 - fly) * 4);
      ctx.fillStyle = "#da4b43";
      ctx.strokeStyle = "#69372f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, unit * 0.13, unit * 0.15, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#735133";
      ctx.beginPath();
      ctx.moveTo(0, -unit * 0.1);
      ctx.lineTo(unit * 0.03, -unit * 0.24);
      ctx.stroke();
      ctx.fillStyle = "#82a755";
      ctx.beginPath();
      ctx.ellipse(
        unit * 0.1,
        -unit * 0.19,
        unit * 0.08,
        unit * 0.035,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
    const bursts =
      e.kind === "spell"
        ? [650, 1950]
        : e.kind === "pokeball"
          ? [1130, 2300]
          : [1050];
    for (const start of bursts) {
      const t = (age - start) / 350;
      if (t < 0 || t > 1) continue;
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7;
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = e.kind === "spell" ? "#c0edac" : "#fff0b6";
        ctx.beginPath();
        ctx.arc(
          p.x + Math.cos(a) * unit * t * 0.8,
          p.y - unit * 0.8 + Math.sin(a) * unit * t * 0.7,
          Math.max(1, unit * 0.065),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  ctx.restore();
}
export function drawPassing(ctx, width, height, strength, time) {
  if (!strength) return;
  ctx.save();
  ctx.fillStyle = `rgba(12,22,57,${strength * 0.72})`;
  ctx.fillRect(0, 0, width, height);
  // Sparse fireflies make the brief night feel alive without masking the map.
  for (let i = 0; i < 14; i++) {
    const x = (i * 197.3 + 41) % width,
      y = (i * 137.9 + height * 0.3) % height;
    ctx.globalAlpha = strength * (0.3 + 0.3 * Math.sin(time / 450 + i));
    ctx.fillStyle = "#f5e9aa";
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
