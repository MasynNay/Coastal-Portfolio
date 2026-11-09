// These effects use simulation time so their animation freezes on pause.
const colors = {
  air: ["#e4fff2", "#9ad8c9"],
  water: ["#ddffff", "#4cc6df"],
  fire: ["#fff1b4", "#f07838"],
  earth: ["#f0f1aa", "#a5d57a"],
};

export function runnerPowerColor(kind) {
  return colors[kind][0];
}

function orbit(ctx, x, y, rx, ry, start, sweep, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, start, start + sweep);
  ctx.stroke();
}

function sparks(ctx, x, y, color, t, count, spread, rise, size) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const a = i * 2.4;
    const d = spread * t * (0.57 + (i % 4) * 0.14);
    const sx = x + Math.cos(a) * d,
      sy = y + Math.sin(a) * d * 0.6 - rise * t;
    const r = size * (1 - t * 0.75);
    ctx.beginPath();
    ctx.moveTo(sx, sy - r * 1.5);
    ctx.lineTo(sx + r, sy);
    ctx.lineTo(sx, sy + r * 1.5);
    ctx.lineTo(sx - r, sy);
    ctx.fill();
  }
}

export function drawPowerPickup(ctx, kind, x, y, scale, time) {
  const [light, dark] = colors[kind];
  const a = time * 3.2;
  ctx.save();
  ctx.globalAlpha = 0.48;
  orbit(ctx, x, y, 31 * scale, 10 * scale, a, Math.PI * 1.6, dark, 3 * scale);
  ctx.globalAlpha = 0.9;
  sparks(
    ctx,
    x,
    y,
    light,
    (time * 0.85) % 1,
    4,
    36 * scale,
    8 * scale,
    3 * scale,
  );
  ctx.restore();
}

export function drawRunnerAura(ctx, state, x, feet, front) {
  const t = state.elapsed;
  const half = front ? 0 : Math.PI;
  ctx.save();
  if (state.jump || state.shield) {
    const shield = state.shield > 0;
    for (let i = 0; i < 3; i++) {
      const ripple = (t * 2 + i / 3) % 1;
      ctx.globalAlpha = (1 - ripple) * (shield ? 0.65 : 0.85);
      orbit(
        ctx,
        x,
        feet - (shield ? 26 + ripple * 64 : 5 + ripple * 22),
        27 + ripple * 32,
        10 + ripple * 7,
        half + 0.1,
        Math.PI - 0.2,
        colors.air[i % 2],
        2 + (1 - ripple) * 3,
      );
    }
  }
  if (state.magnet > 0) {
    for (let i = 0; i < 2; i++) {
      const wave = Math.sin(t * 8 + i * Math.PI);
      ctx.globalAlpha = 0.78 - i * 0.22;
      orbit(
        ctx,
        x,
        feet - 12 - i * 20 + wave * 4,
        47 - i * 5,
        11 + wave * 2,
        half + 0.12,
        Math.PI - 0.24,
        colors.water[i],
        3 + i,
      );
    }
    if (front) {
      ctx.globalAlpha = 0.52;
      sparks(ctx, x, feet - 13, colors.water[0], (t * 1.7) % 1, 5, 52, 45, 3);
    }
  }
  if (state.multiplier > 0 && front) {
    // Earth leaves staggered crystal shards in the rider's footfalls.
    for (let i = 0; i < 4; i++) {
      const age = (t * 2.5 + i / 4) % 1;
      const px = x + (i % 2 ? 1 : -1) * (24 + age * 12);
      const y = feet + 7 + age * 26;
      const height = Math.sin(age * Math.PI) * 28;
      ctx.globalAlpha = 0.9 * (1 - age);
      ctx.fillStyle = colors.earth[1];
      ctx.beginPath();
      ctx.moveTo(px - 7, y);
      ctx.lineTo(px - 1, y - height);
      ctx.lineTo(px + 6, y - height * 0.55);
      ctx.lineTo(px + 8, y);
      ctx.fill();
      ctx.fillStyle = colors.earth[0];
      ctx.beginPath();
      ctx.moveTo(px - 7, y);
      ctx.lineTo(px - 1, y - height);
      ctx.lineTo(px, y);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawRunnerCast(ctx, state, x, feet) {
  ctx.save();
  for (const [kind, started] of Object.entries(state.effects)) {
    const power = kind === "shieldBreak" ? "air" : kind;
    const [light, dark] = colors[power];
    const t = (state.elapsed - started) / (kind === "fire" ? 0.85 : 0.55);
    if (t >= 1) continue;
    ctx.globalAlpha = 1 - t;
    if (kind === "fire") {
      // A fire fan climbs the bridge while struck obstacles shed embers.
      const y = feet - 40 - t * 245;
      orbit(
        ctx,
        x,
        y,
        36 + t * 160,
        20 + t * 23,
        0.1,
        Math.PI - 0.2,
        dark,
        12 - t * 8,
      );
      orbit(
        ctx,
        x,
        y + 2,
        32 + t * 155,
        16 + t * 23,
        0.2,
        Math.PI - 0.4,
        light,
        5,
      );
      ctx.fillStyle = dark;
      for (let i = -3; i <= 3; i++) {
        const px = x + i * (12 + t * 30);
        const base = y + 14 + t * 16 - Math.abs(i) * 3;
        const reach = (26 + Math.sin(t * 18 + i) * 9) * (1 - t * 0.6);
        ctx.beginPath();
        ctx.moveTo(px - 8, base);
        ctx.quadraticCurveTo(px - 12, base - reach * 0.5, px + 5, base - reach);
        ctx.quadraticCurveTo(px + 2, base - reach * 0.5, px + 11, base - 5);
        ctx.fill();
      }
      sparks(ctx, x, y, light, t, 12, 153, 49, 6);
    } else {
      const rise = kind === "earth" ? 48 : 78;
      orbit(
        ctx,
        x,
        feet - 18 - t * rise,
        22 + t * 86,
        9 + t * 24,
        t * 4,
        Math.PI * 1.8,
        dark,
        7 - 4 * t,
      );
      sparks(
        ctx,
        x,
        feet - 40,
        light,
        t,
        kind === "shieldBreak" ? 16 : 9,
        99,
        rise,
        5,
      );
    }
  }
  const flash = (state.elapsed - state.coinFlash) / 0.44;
  if (flash >= 0 && flash < 1) {
    ctx.globalAlpha = 1 - flash;
    ctx.font = "bold 21px system-ui";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#4a382a";
    ctx.lineWidth = 4;
    ctx.fillStyle = "#fff1a4";
    const label = "+" + state.coinPoints,
      y = feet - 114 - flash * 26;
    ctx.strokeText(label, x + 43, y);
    ctx.fillText(label, x + 43, y);
  }
  ctx.restore();
}

export function drawBurningObstacle(ctx, x, y, scale, progress) {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  sparks(
    ctx,
    x,
    y,
    colors.fire[0],
    progress,
    12,
    104 * scale,
    96 * scale,
    9 * scale,
  );
  ctx.restore();
}
