import { useEffect, useRef, useState } from "react";
import { artwork, drawSprite } from "./art";
import { imageSource } from "./ImageSource";
import { characterAsset } from "./Wardrobe";
import {
  accessories,
  baseOptions,
  bottoms,
  cleanLook,
  hairColors,
  hairstyles,
  hats,
  presetLook,
  stylesFor,
  themes,
  tops,
} from "./CustomWardrobe";
import { characters } from "./config";
import "./WardrobeStudio.css";

function WardrobePreview({ character, look, direction, action }) {
  const canvas = useRef(null);
  const base = characterAsset(character, look.base);
  const asset =
    action === "walk"
      ? base
      : artwork[base + "-" + action]
        ? base + "-" + action
        : base;
  useEffect(() => {
    const sheet = artwork[asset];
    const context = canvas.current?.getContext("2d");
    if (!sheet || !context) return;
    const image = new Image();
    let timer,
      active = true;
    const started = performance.now();
    const paint = () => {
      if (!active) return;
      context.clearRect(0, 0, 280, 240);
      context.fillStyle = "#15252170";
      context.beginPath();
      context.ellipse(140, 211, 48, 9, 0, 0, Math.PI * 2);
      context.fill();
      drawSprite(
        context,
        image,
        sheet,
        140,
        210,
        (155 * sheet.ch) / sheet.bodyHeight,
        action === "climb" ? 4 : action === "cheer" ? 0 : direction,
        true,
        performance.now() - started,
        undefined,
        1,
        { ...look, enabled: true },
      );
    };
    image.onload = () => {
      if (!active) return;
      paint();
      timer = setInterval(paint, 80);
    };
    image.src = imageSource(sheet);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [asset, action, direction, look]);
  return (
    <canvas
      ref={canvas}
      width={280}
      height={240}
      role="img"
      aria-label="Live preview of the selected character's clothes"
    />
  );
}

const choices = (options) =>
  Object.entries(options).map(([id, value]) => ({
    id,
    name: typeof value === "string" ? value : value.name,
    color: value.color,
  }));

export default function WardrobeStudio({
  character,
  outfit,
  saved,
  onWear,
  onRestore,
}) {
  const [look, setLook] = useState(() =>
    cleanLook(character, saved || { base: outfit }),
  );
  const [direction, setDirection] = useState(0);
  const [action, setAction] = useState("walk");
  const [note, setNote] = useState("");
  const person = characters.find((entry) => entry.id === character);
  const edit = (key, value) => {
    setLook((current) =>
      cleanLook(character, { ...current, [key]: value, enabled: true }),
    );
    setNote("");
  };
  const fields = [
    ["top", "Shirt / top", choices(tops)],
    ["bottom", "Pants / skirt", choices(bottoms)],
    ["hat", "Hat", choices(hats)],
    ["accessory", "Accessory", choices(accessories)],
    [
      "hair",
      "Hairstyle",
      stylesFor(character).map((id) => ({ id, name: hairstyles[id] })),
    ],
    ["hairColor", "Hair color", choices(hairColors)],
  ];
  return (
    <div className="wardrobe-studio">
      <div className="wardrobe-intro">
        <p>{person?.name}&apos;s dressing room</p>
        <span>
          Mix theme presets, your illustrated outfits, garment colors, hats and
          accessories. Your personal look stays saved on this device.
        </span>
      </div>
      <div className="wardrobe-layout">
        <section className="wardrobe-preview-card" aria-label="Outfit preview">
          <WardrobePreview
            character={character}
            look={look}
            direction={direction}
            action={action === "cheer" ? "climb" : action}
          />
          <div className="wardrobe-preview-controls">
            <label>
              Preview action
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="walk">Walk</option>
                <option value="run">Run</option>
                <option value="climb">Climb</option>
                <option value="water-ride">Seated</option>
              </select>
            </label>
            <label>
              View
              <select
                value={direction}
                onChange={(e) => setDirection(Number(e.target.value))}
                disabled={action === "climb"}
              >
                <option value={0}>Front</option>
                <option value={2}>Right</option>
                <option value={4}>Back</option>
                <option value={6}>Left</option>
              </select>
            </label>
          </div>
          <button
            className="wardrobe-wear"
            onClick={() => {
              onWear({ ...look, enabled: true });
              setNote("Look equipped and saved.");
            }}
          >
            Wear This Look
          </button>
          <button
            className="wardrobe-restore"
            onClick={() => {
              onRestore();
              setNote("Original outfits restored.");
            }}
          >
            Restore Original Outfits
          </button>
          <p role="status" className="wardrobe-status">
            {note}
          </p>
        </section>
        <section className="wardrobe-options" aria-label="Customize outfit">
          <h3>Theme Closet</h3>
          <div className="wardrobe-themes">
            {themes.map((theme) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => {
                  setLook(presetLook(character, theme));
                  setNote("");
                }}
              >
                <span
                  className="wardrobe-theme-swatch"
                  style={{ background: tops[theme.top]?.color || "#bcb5a3" }}
                  aria-hidden="true"
                />
                <span>
                  <strong>{theme.name}</strong>
                  <small>{theme.inspiration}</small>
                </span>
              </button>
            ))}
          </div>
          <h3>Make It Your Own</h3>
          <label className="wardrobe-base">
            Illustrated outfit
            <select
              value={look.base || ""}
              onChange={(e) => edit("base", e.target.value || null)}
            >
              {baseOptions(character).map((base) => (
                <option key={base.id || "default"} value={base.id || ""}>
                  {base.name}
                </option>
              ))}
            </select>
          </label>
          <div className="wardrobe-fields">
            {fields.map(([key, label, options]) => (
              <label key={key}>
                {label}
                <span className="wardrobe-select">
                  {options.find((o) => o.id === look[key])?.color && (
                    <i
                      style={{
                        background: options.find((o) => o.id === look[key])
                          .color,
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <select
                    value={look[key]}
                    onChange={(e) => edit(key, e.target.value)}
                  >
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            ))}
          </div>
          <p className="wardrobe-note">
            Garment finishes keep the cut of the selected illustrated outfit;
            hats, hair styling details and accessories are separate
            mix-and-match pieces. Hundreds of combinations without replacing the
            character's animation.
          </p>
        </section>
      </div>
    </div>
  );
}
