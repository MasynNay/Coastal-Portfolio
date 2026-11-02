import { createArtCache, drawSprite } from "./art";
import { imageSource } from "./ImageSource";
import sheets from "./SpriteSheets.json";
import { spriteFrame } from "./animation";
import fs from "fs";
import path from "path";
test("adventurer edges stay opaque while both render passes use the exact same pose", () => {
  for (const id of ["link", "link-run", "link-surf", "ability-ocarina"]) {
    for (let direction = 0; direction < 8; direction++) {
      const calls = [],
        image = {};
      const ctx = {
        globalAlpha: 1,
        imageSmoothingEnabled: true,
        save() {},
        restore() {},
        translate() {},
        scale() {},
        drawImage(...args) {
          calls.push({
            args,
            smoothing: this.imageSmoothingEnabled,
            alpha: this.globalAlpha,
          });
        },
      };
      drawSprite(ctx, image, sheets[id], 100, 120, 64, direction, true, 350);
      expect(calls.map((c) => c.smoothing)).toEqual([false, true]);
      expect(calls[0].args).toEqual(calls[1].args);
      expect(calls.map((c) => c.alpha)).toEqual([1, 1]);
      expect(ctx.imageSmoothingEnabled).toBe(true);
    }
  }
});
test("ordinary artwork and explicit fades still use one draw at their intended opacity", () => {
  for (const [id, alpha] of [
    ["masyn", 1],
    ["link", 0.35],
  ]) {
    const draw = jest.fn();
    const ctx = {
      globalAlpha: alpha,
      imageSmoothingEnabled: true,
      save() {},
      restore() {},
      translate() {},
      scale() {},
      drawImage: draw,
    };
    drawSprite(ctx, {}, sheets[id], 0, 0, 64, 5, true, 350);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(ctx.globalAlpha).toBe(alpha);
  }
});
// Read PNG headers without another image decoder. Every actual sampled run
// frame must fit the shipped file, not just the manifest's claimed row count.
test("every running frame in every direction fits a real non-empty shipped atlas", () => {
  for (const s of Object.values(sheets).filter((s) => s.action === "run")) {
    const png = fs.readFileSync(path.join(process.cwd(), "public", s.src));
    const width = png.readUInt32BE(16),
      height = png.readUInt32BE(20);
    expect(width).toBe(s.cw * s.columns);
    expect(height).toBe(s.ch * s.rows);
    expect(s.revision).toBeTruthy();
    for (let d = 0; d < 8; d++)
      for (let col = 0; col < s.columns; col++) {
        const f = spriteFrame(s, d, true, col * s.frameMs);
        expect((f.row + 1) * s.ch).toBeLessThanOrEqual(height);
        expect((f.column + 1) * s.cw).toBeLessThanOrEqual(width);
      }
  }
});
test("the image cache decodes once and uses the content-versioned URL", async () => {
  const Original = global.Image,
    created = [];
  global.Image = class {
    constructor() {
      created.push(this);
    }
    set src(value) {
      this.url = value;
      Promise.resolve().then(() => this.onload());
    }
    decode() {
      return Promise.resolve();
    }
  };
  try {
    const cache = createArtCache(),
      first = cache.load("masyn-run"),
      second = cache.load("masyn-run");
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect(created).toHaveLength(1);
    expect(a.url).toBe(imageSource(sheets["masyn-run"]));
    expect(cache.get("masyn-run")).toBe(a);
  } finally {
    global.Image = Original;
  }
});

test("illustrated skating loops follow the ride clock without playing the reserved idle cell", () => {
  const { boardPose } = require("./Riding");
  for (const name of ["masyn", "mi-shell", "ezra", "fallyn", "fitzgerald"]) {
    const s = sheets[name + "-board-ride"];
    expect(s.drawn).toBe(true);
    expect(s.cycleFrames).toBeGreaterThanOrEqual(8);
    expect(s.columns).toBe(s.cycleFrames + 1);
    for (let col = 0; col < s.cycleFrames; col++) {
      const p = boardPose(
        name,
        { moving: true, gaitTime: col * s.frameMs },
        false,
        99999,
        sheets,
      );
      expect(spriteFrame(s, 6, p.moving, p.time).column).toBe(col);
    }
    expect(spriteFrame(s, 6, false, 99999).column).toBe(s.idleFrame);
    expect(spriteFrame(s, 6, true, s.cycleFrames * s.frameMs).column).toBe(0);
  }
});

test("decoded artwork is bounded by memory use and recently drawn costumes stay cached", async () => {
  const Original = global.Image,
    created = [];
  global.Image = class {
    constructor() {
      this.width = 64;
      this.height = 64;
      created.push(this);
    }
    set src(value) {
      this.url = value;
      Promise.resolve().then(() => this.onload());
    }
    decode() {
      return Promise.resolve();
    }
  };
  try {
    const cache = createArtCache({ maxBytes: 2 * 64 * 64 * 4 });
    await cache.load("masyn");
    await cache.load("mi-shell");
    cache.get("masyn"); // Drawing this costume makes it the most recent image.
    await cache.load("ezra");
    expect(cache.get("masyn")).toBeDefined();
    expect(cache.get("mi-shell")).toBeUndefined();
    await cache.load("masyn");
    expect(created).toHaveLength(3);
    await cache.load("mi-shell");
    expect(created).toHaveLength(4); // Eviction really released the old pending promise too.
    cache.clear();
    expect(cache.get("masyn")).toBeUndefined();
  } finally {
    global.Image = Original;
  }
});
