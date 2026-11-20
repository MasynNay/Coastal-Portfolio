// Deterministic star distributions make the galaxy studies continuous: resizing
// or pausing never regenerates random stars. Form, inclination, arms, tilt and
// interacting companions alter geometry, not only the palette.
const TAU = Math.PI * 2;
const fract = (n) => n - Math.floor(n);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function drawGalaxy(grid, scene) {
  const { style, time, food } = scene;
  const w = grid.columns,
    h = grid.rows;
  for (let i = 0; i < 340; i++) {
    const x = fract(i * 0.618033 + style.seed * 0.13) * w;
    const y = fract(i * 0.414214 + style.seed * 0.07) * h;
    grid.put(
      x,
      y,
      i % 29 ? "." : "+",
      mix([46, 58, 94], style.accent, 0.15 + Math.sin(time + i) ** 2 * 0.2),
    );
  }
  function disk(
    cx,
    cy,
    radius,
    form,
    phase = 0,
    tilt = style.tilt,
    inclination = style.inclination,
  ) {
    const arms = Math.max(1, style.arms);
    const smooth = [
      "elliptical",
      "lenticular",
      "compact",
      "dwarf",
      "irregular",
    ].includes(form);
    const angle = phase + time * (form === "edge" ? 0.006 : 0.018);
    const count = radius < 12 ? 700 : form === "dwarf" ? 1000 : 2700;
    for (let i = 0; i < count; i++) {
      let r = Math.sqrt(fract(i * 0.618034 + 0.017));
      const noise = fract(i * 0.754877 + style.seed) - 0.5;
      let theta = smooth
        ? i * 2.39996
        : ((i % arms) / arms) * TAU +
          r * (form === "grand" ? 4 : 7) +
          noise * (0.15 + r * 0.65);
      if (form === "ring" || form === "polar") r = 0.78 + noise * 0.13;
      if (form === "irregular") r *= 0.7 + Math.sin(theta * 3) * 0.22;
      if (form === "compact") r **= 2;
      theta += angle;
      let x = Math.cos(theta) * r * radius;
      let y = Math.sin(theta) * r * radius * inclination * 0.6;
      if (form === "barred" && r < 0.3) {
        x = noise * radius * 0.65;
        y *= 0.2;
      }
      const px = cx + x * Math.cos(tilt) - y * Math.sin(tilt);
      const py = cy + x * Math.sin(tilt) * 0.6 + y * Math.cos(tilt);
      const shade = Math.max(0.12, 1 - r * 0.72);
      let color = mix(style.accent, [255, 235, 190], (1 - r) ** 3);
      if (
        (form === "edge" || form === "dust") &&
        Math.abs(y) < 0.65 &&
        r > 0.14
      )
        color = mix(style.water, color, 0.18);
      if (form === "nursery" && Math.sin(r * 27 + theta * 5) > 0.85)
        color = [236, 170, 211];
      grid.put(
        px,
        py,
        r < 0.12 ? "@" : shade > 0.62 ? "*" : i % 4 ? ":" : ".",
        mix(style.water, color, shade),
      );
    }
    if (form !== "ring")
      grid.oval(cx, cy, radius * 0.1, radius * 0.065, [251, 222, 182]);
  }
  const form = style.form;
  if (form === "pair" || form === "bridge") {
    disk(w * 0.34, h * 0.42, Math.min(w * 0.28, h * 0.65), "spiral");
    disk(w * 0.7, h * 0.62, Math.min(w * 0.23, h * 0.52), "spiral", 2);
    if (form === "bridge")
      for (let i = 0; i < 160; i++) {
        const t = i / 160;
        grid.put(
          w * (0.34 + t * 0.36),
          h * (0.42 + t * 0.2) + Math.sin(t * Math.PI) * 2 + Math.sin(i) * 0.7,
          ":",
          style.accent,
        );
      }
  } else if (form === "cluster") {
    for (let i = 0; i < 7; i++)
      disk(
        w * (0.14 + fract(i * 0.37) * 0.75),
        h * (0.18 + fract(i * 0.27) * 0.63),
        6 + (i % 3) * 2,
        i % 2 ? "elliptical" : "spiral",
        i,
      );
  } else {
    const radius = Math.min(w * 0.4, h * (form === "dwarf" ? 0.55 : 0.95));
    disk(w / 2, h / 2, radius, form);
    if (form === "polar")
      disk(w / 2, h / 2, radius * 0.83, "ring", 1, 1.3, 0.6);
    if (form === "starburst")
      for (let i = -15; i <= 15; i++) {
        grid.put(
          w / 2 + Math.sin(i * 0.3) * Math.abs(i) * 0.14,
          h / 2 + i,
          ":",
          mix(style.accent, [255, 204, 174], 0.4),
        );
      }
  }
  // A tap produces a brief expanding starlight ripple, not falling fish food.
  for (const pulse of food.slice(0, 6)) {
    const radius = pulse.age * 8;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU;
      grid.put(
        pulse.x * w + Math.cos(a) * radius,
        h / 2 + Math.sin(a) * radius * 0.55,
        "+",
        mix(style.water, style.accent, Math.max(0, 1 - pulse.age / 6)),
      );
    }
  }
}
