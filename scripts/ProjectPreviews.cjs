const fs = require("fs");
const path = require("path");

// Vector interface illustrations for project cards, not browser captures. Each
// uses the local demo's actual workflows and sample data. Re-run after editing
// these layouts; shared React chrome adds the browser frame around every image.
const output = path.join(__dirname, "../public/images/projects");
fs.mkdirSync(output, { recursive: true });
const escape = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const text = (x, y, label, size = 18, fill = "#e5efec", extra = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(label)}</text>`;
const box = (x, y, w, h, fill, radius = 14, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" ${extra}/>`;
function button(x, y, w, label, primary = false) {
  return (
    box(x, y, w, 42, primary ? "#bad8c4" : "#263b40", 9) +
    text(
      x + w / 2,
      y + 27,
      label,
      15,
      primary ? "#13372d" : "#d9e6df",
      'text-anchor="middle" font-weight="600"',
    )
  );
}
function logo(file) {
  return (
    "data:image/png;base64," +
    fs.readFileSync(path.join(__dirname, "..", file)).toString("base64")
  );
}
function save(name, title, drawing) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
<title>${title} interface preview</title>
<desc>A modern interface illustration based on the local ${title} demo, not a captured browser screenshot.</desc>
<defs>
  <linearGradient id="surface" x2="1" y2="1"><stop stop-color="#20333b"/><stop offset="1" stop-color="#0d181e"/></linearGradient>
  <linearGradient id="poster" x2="1" y2="1"><stop stop-color="#81ad96"/><stop offset=".5" stop-color="#294b46"/><stop offset="1" stop-color="#1a2e3b"/></linearGradient>
</defs>
<g font-family="Arial, Helvetica, sans-serif">${drawing}</g>
</svg>\n`;
  fs.writeFileSync(path.join(output, name + ".svg"), svg);
  console.log(`Updated ${name}.svg`);
}

save(
  "mixstream",
  "MixStream",
  [
    box(0, 0, 1200, 700, "#101c22", 0),
    box(0, 0, 1200, 80, "#17292e", 0),
    text(38, 51, "MixStream", 30, "#d4efdb", 'font-weight="700"'),
    text(910, 48, "Movies & shows", 16, "#b2c8bf"),
    box(1086, 24, 76, 34, "#29443f", 8),
    text(1109, 47, "US", 15),
    box(0, 80, 245, 620, "#15262b", 0),
    text(28, 130, "YOUR LIBRARY", 13, "#91b4a5", 'letter-spacing="2"'),
    box(18, 154, 208, 48, "#2c4943", 8),
    text(38, 185, "Search", 18, "#e0f0e3", 'font-weight="600"'),
    text(38, 239, "Saved favorites", 17, "#aec8ba"),
    text(28, 326, "RECENT SEARCHES", 12, "#91b4a5", 'letter-spacing="1.5"'),
    text(38, 367, "The Matrix", 17, "#deebe2"),
    text(38, 407, "Lord of the Rings", 17, "#9bb4ad"),
    text(38, 447, "Studio Ghibli", 17, "#9bb4ad"),
    text(285, 141, "Find a Movie or Show", 31, "#edf5e9", 'font-weight="700"'),
    text(
      285,
      176,
      "Search a title. Save a favorite. Find where to watch.",
      17,
      "#9cb8ae",
    ),
    box(285, 204, 726, 52, "#20343a", 10, 'stroke="#405c59"'),
    text(306, 237, "The Matrix", 18),
    button(1025, 209, 135, "Search", true),
    text(285, 306, "Search results", 20, "#dce9e2", 'font-weight="600"'),
    text(1060, 305, "1 result", 14, "#91b4a5"),
    box(285, 331, 875, 316, "url(#surface)", 16, 'stroke="#34524d"'),
    box(308, 354, 188, 270, "url(#poster)", 9),
    '<path d="M320 585 470 387M349 622 487 442M315 523 430 363" stroke="#b5dfbd" stroke-opacity=".18" stroke-width="12"/>',
    text(331, 476, "THE", 18, "#d9e9d6", 'letter-spacing="6"'),
    text(
      330,
      513,
      "MATRIX",
      29,
      "#f0f8e4",
      'font-weight="700" letter-spacing="2"',
    ),
    text(528, 390, "The Matrix", 32, "#edf4e9", 'font-weight="700"'),
    text(530, 426, "1999  ·  Film  ·  Science fiction", 16, "#a9c0b4"),
    text(530, 478, "A computer hacker discovers a reality", 18, "#cfdfd6"),
    text(530, 507, "far beyond the world he knows.", 18, "#cfdfd6"),
    button(530, 554, 184, "Save favorite", true),
    button(729, 554, 186, "Where to watch"),
    text(
      1095,
      676,
      "PREVIEW",
      11,
      "#708d84",
      'text-anchor="end" letter-spacing="2"',
    ),
  ].join("\n"),
);

save(
  "typeninja",
  "TypeNinja",
  [
    box(0, 0, 1200, 700, "#102c28", 0),
    `<image href="${logo("public/typing/TypeNinja.png")}" x="48" y="33" width="86" height="86"/>`,
    text(153, 57, "TYPING TEST", 12, "#9cbab0", 'letter-spacing="3"'),
    text(150, 96, "TypeNinja", 34, "#e3eee1", 'font-weight="700"'),
    text(153, 123, "A little practice. A quicker keyboard.", 16, "#a1bcb0"),
    button(1012, 56, 136, "Scores"),
    button(51, 165, 80, "15s"),
    button(141, 165, 80, "30s", true),
    button(231, 165, 80, "60s"),
    button(875, 165, 117, "Words", true),
    button(1004, 165, 144, "Developer"),
    ...[
      ["24", "SECONDS LEFT"],
      ["73", "WPM"],
      ["98%", "ACCURACY"],
      ["81", "PERSONAL BEST"],
    ].map(
      ([value, label], i) =>
        box(51 + i * 281, 237, 254, 113, "#1d3c34", 13) +
        text(75 + i * 281, 289, value, 38, "#d4e5b9", 'font-weight="700"') +
        text(76 + i * 281, 323, label, 11, "#a3c1af", 'letter-spacing="1.5"'),
    ),
    box(51, 376, 1097, 5, "#315246", 2),
    box(51, 376, 659, 5, "#bdd6a7", 2),
    box(51, 405, 1097, 186, "#18382f", 14, 'stroke="#557c5f"'),
    text(
      82,
      458,
      "build small things learn something new",
      28,
      "#b5d5b7",
      'font-family="monospace"',
    ),
    text(
      82,
      505,
      "practice every day and keep going",
      28,
      "#a1b3a4",
      'font-family="monospace"',
    ),
    text(
      82,
      552,
      "create explore improve repeat",
      28,
      "#6f9580",
      'font-family="monospace"',
    ),
    '<path d="M383 479v34" stroke="#e6d995" stroke-width="3"/>',
    button(51, 618, 192, "Restart round"),
    text(277, 646, "Sample round · timed words & local scores", 16, "#a2bcac"),
  ].join("\n"),
);

save(
  "semisnitch",
  "SemiSnitch",
  [
    box(0, 0, 1200, 700, "#101d2b", 0),
    box(0, 0, 1200, 83, "#1b2e40", 0),
    `<image href="${logo("public/demos/semisnitch/logo.png")}" x="27" y="13" width="80" height="57"/>`,
    text(119, 51, "SemiSnitch", 27, "#edf2f5", 'font-weight="700"'),
    text(958, 49, "LOCAL PROJECT DEMO", 12, "#a9bfcb", 'letter-spacing="1"'),
    text(48, 140, "Sample fleet · January", 31, "#f0f3f2", 'font-weight="700"'),
    text(
      49,
      173,
      "Review idle events and track coaching in one place.",
      17,
      "#a5bac9",
    ),
    button(792, 112, 166, "Import JSON", true),
    button(973, 112, 179, "Download sample"),
    ...[
      ["1", "SAVED REPORT"],
      ["2", "IDLE EVENTS"],
      ["95 min", "TOTAL IDLE TIME"],
    ].map(
      ([value, label], i) =>
        box(48 + i * 377, 211, 350, 108, "#203349", 12) +
        text(70 + i * 377, 255, label, 12, "#adc3d0", 'letter-spacing="1.5"') +
        text(70 + i * 377, 294, value, 30, "#e1e9eb", 'font-weight="700"'),
    ),
    box(48, 352, 1104, 254, "#182b3c", 14, 'stroke="#344b60"'),
    text(72, 393, "Driver", 15, "#a4bcc8"),
    text(370, 393, "Vehicle", 15, "#a4bcc8"),
    text(582, 393, "Idle time", 15, "#a4bcc8"),
    text(777, 393, "Coaching status", 15, "#a4bcc8"),
    '<path d="M48 417h1104M48 504h1104" stroke="#344b60"/>',
    text(72, 470, "Demo Driver A", 20),
    text(370, 470, "DEMO-101", 18, "#b7cbd5"),
    text(582, 470, "75 min", 20),
    box(775, 442, 231, 40, "#4b4032", 20),
    text(795, 468, "Needs coaching", 15, "#ecd3a2"),
    text(72, 557, "Demo Driver B", 20),
    text(370, 557, "DEMO-102", 18, "#b7cbd5"),
    text(582, 557, "20 min", 20),
    box(775, 529, 231, 40, "#25453e", 20),
    text(795, 555, "Does not need coaching", 14, "#bcd7c1"),
    text(
      50,
      650,
      "Fictional sample data · changes stay on this device",
      15,
      "#95b0bf",
    ),
    text(
      1148,
      650,
      "PREVIEW",
      11,
      "#7e9aa9",
      'text-anchor="end" letter-spacing="2"',
    ),
  ].join("\n"),
);
