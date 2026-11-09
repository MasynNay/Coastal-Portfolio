import {
  drawGroveLights,
  drawGroveSpirit,
  groveSpirits,
  groveTree,
} from "./ForestGrove";
import { drawWindSong } from "./WindStatue";
import { surfboard, drawSurfWave } from "./SurfRide";
import { skyBirds } from "./Sky";
import {
  beachSprites,
  drawFootprints,
  drawBeachActivities,
} from "./BeachScene";
import { imageSource } from "./ImageSource";
import { axolotlRaceMarker, raceView } from "./AxolotlRace";
import { drawRaceCourse } from "./RaceCourse";
import { restSpots } from "./RestSpots";
import { skateboard } from "./SkateRide";
import { fishSpecies } from "./Fish";
import { terrariumSpecies } from "./Bugs";
import { drawTricks, drawPassing } from "./TrickEffects";
import { bikes, bikeHeight } from "./Bikes";
import { glideVisual } from "./Glide";
import { abilityActive, abilityColumn } from "./Abilities";
import { drawFishingLine } from "./FishingLine";
import { personHeight, animalHeight } from "./Movement";
import { gaitTimeForSheet } from "./Gait";
import { playerPose } from "./PlayerPose";
import { activityAsset, characterAsset } from "./Wardrobe";
import { spriteFrame, runningLift } from "./animation";
import { createTownTerrain } from "./TownTerrain";
import { watercraft } from "./Harbor";
import { boardPose } from "./Riding";
import { drawActivities } from "./ActivityEffects";
import { townDecor, townProps, mailboxes, windfallTree } from "./TownLayout";
import {
  flightFrame,
  flightAppearance,
  flyDepartureMs,
  flyArrivalMs,
} from "./Fly";
import { roomBounds, buildingHeight } from "./WorldLayout";
import { artwork, createArtCache, drawSprite } from "./art";
import { buildings, residents, animals, characters } from "./config";

const jetSkiSeatHeights = [0.55, 0.45, 0.3, 0.45, 0.55, 0.45, 0.3, 0.45];
const humanIds = new Set(characters.map((character) => character.id));

// Emerald-inspired overhead renderer. Original artwork, shared movement and room secrets;
// no 3D models, skeletons, ray tracing or large model-view atlases are loaded here.
export function createCanvasScene(host, invalidate = () => {}) {
  let disposed = false;
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");
  canvas.setAttribute("aria-label", "Pixel-art portfolio village");
  canvas.tabIndex = 0;
  host.appendChild(canvas);
  const art = createArtCache(),
    pixels = new Map(),
    requested = new Map();
  const bugArt = new Set(terrariumSpecies.map((s) => s.art));
  const terrain = createTownTerrain(art);
  let saluting = null;
  let width = 1,
    height = 1,
    unit = 24,
    zoom = 0.68,
    townZoom = 0.68,
    roomZoom = 1,
    holdingFade = false,
    viewY = 0.55,
    room = null,
    focus = {
      x: 0,
      z: 9,
    },
    labels = [],
    flight = 0,
    flightMode = "in";
  const at = (x, z) => ({
    x: width / 2 + (x - focus.x) * unit,
    y: height * viewY + (z - focus.z) * unit,
  });
  function image(id) {
    if (disposed) return null;
    const version = artwork[id] ? imageSource(artwork[id]) : "";
    const cached = pixels.get(id);
    if (cached?.version === version) {
      pixels.delete(id);
      pixels.set(id, cached);
      return cached.image;
    }
    pixels.delete(id);
    const original = art.get(id),
      sheet = artwork[id];
    if (!original || !sheet) {
      if (sheet && requested.get(id) !== version) {
        requested.set(id, version);
        art
          .load(id)
          .then(() => {
            if (!disposed) invalidate();
          })
          .catch((error) => {
            if (!disposed) console.error(error);
          })
          .finally(() => {
            // An evicted image must be loadable again on the next visit.
            if (requested.get(id) === version) requested.delete(id);
          });
      }
      return null;
    }
    if (sheet.native || sheet.pixelArt || !sheet.cw) {
      // Native character/vehicle art belongs only to the bounded art cache.
      // A second permanent reference here would defeat its memory limit.
      return original;
    }
    // Build each frame independently at half its prepared size. The previous quarter-size
    // pass discarded facial detail, then stretched those coarse pixels across the screen.
    const factor = sheet.cw ? 0.5 : 0.22;
    const c = document.createElement("canvas");
    c.width = Math.round(original.width * factor);
    c.height = Math.round(original.height * factor);
    const cctx = c.getContext("2d");
    if (sheet.cw) {
      const frame = document.createElement("canvas");
      frame.width = sheet.cw;
      frame.height = sheet.ch;
      const frameCtx = frame.getContext("2d", {
        willReadFrequently: true,
      });
      for (let row = 0; row < (sheet.rows || 8); row++)
        for (let column = 0; column < (sheet.columns || 4); column++) {
          frameCtx.clearRect(0, 0, frame.width, frame.height);
          frameCtx.drawImage(
            original,
            column * sheet.cw,
            row * sheet.ch,
            sheet.cw,
            sheet.ch,
            0,
            0,
            sheet.cw,
            sheet.ch,
          );
          cctx.drawImage(
            frame,
            0,
            0,
            sheet.cw,
            sheet.ch,
            column * sheet.cw * factor,
            row * sheet.ch * factor,
            sheet.cw * factor,
            sheet.ch * factor,
          );
        }
    } else cctx.drawImage(original, 0, 0, c.width, c.height);
    pixels.set(id, { version, image: c });
    // Only small converted legacy atlases need this additional cache.
    while (pixels.size > 24) pixels.delete(pixels.keys().next().value);
    return c;
  }
  function drawRestSpot(spot, state) {
    const seated = state.rest?.id === spot.id,
      p = at(spot.x, spot.z);
    ctx.save();
    ctx.translate(p.x, p.y);
    if (seated) ctx.rotate(state.rest.rock || 0);
    ctx.translate(-p.x, -p.y);
    sprite(spot.art, spot.x, spot.z, spot.h, 0, false, state.worldTime);
    if (seated) {
      sprite(
        activityAsset(state.character, state.outfit, "water-ride", artwork),
        spot.x + spot.seatX,
        spot.z + spot.seatZ,
        personHeight(state.character),
        spot.direction,
        false,
        0,
      );
    }
    ctx.restore();
  }
  function drawSurfer(entry, state) {
    const ride = entry.ride;
    if (ride)
      drawSurfWave(
        ctx,
        at,
        unit,
        ride,
        image("surf-wake"),
        artwork["surf-wake"],
      );
    const point = at(entry.x, entry.z),
      heading = ride?.direction ?? 6;
    ctx.save();
    ctx.translate(point.x, point.y - (ride?.lift || 0) * unit);
    ctx.rotate(
      [0, Math.PI / 4, 0, Math.PI / 4, 0, -Math.PI / 4, 0, -Math.PI / 4][
        heading
      ],
    );
    ctx.translate(-point.x, -point.y);
    sprite(
      "surfboard",
      entry.x,
      entry.z,
      2.6,
      heading,
      !!ride,
      state.rideTime ?? state.worldTime,
    );
    ctx.restore();
    if (ride)
      sprite(
        activityAsset(
          state.character,
          state.outfit,
          ride.phase === "launching" ? "water-ride" : "board-ride",
          artwork,
        ),
        entry.x,
        entry.z,
        personHeight(state.character),
        ride.direction,
        true,
        state.rideTime ?? state.worldTime,
        0.05 + (ride.lift || 0),
        true,
      );
  }
  function sprite(
    id,
    x,
    z,
    h,
    d = 0,
    moving = false,
    time = 0,
    lift = 0,
    human = false,
  ) {
    let img = image(id);
    // Keep the matching walking body visible while its run atlas is decoding.
    // New or uncached costumes must never disappear on the first Shift press.
    if (!img && id.endsWith("-run")) {
      id = id.slice(0, -4);
      img = image(id);
    }
    if (
      !img &&
      /-(board-trick|wake-ride|board-ride|water-ride|bike-acro|bike-mach|fish-surf|fish|surf)$/.test(
        id,
      )
    ) {
      id = id.replace(
        /-(board-trick|wake-ride|board-ride|water-ride|bike-acro|bike-mach|fish-surf|fish|surf)$/,
        "",
      );
      img = image(id);
    }
    const sheet =
      artwork[id]?.action === "fish" &&
      !artwork[id].illustratedRod &&
      !artwork[id].rootAligned
        ? {
            ...artwork[id],
            bodyOnly: true,
          }
        : artwork[id];
    if (!img) return;
    if (
      saluting &&
      image(saluting.asset) &&
      id !== saluting.asset &&
      (id === saluting.base || id.startsWith(saluting.base + "-"))
    ) {
      const frame = spriteFrame(sheet, d, moving, time),
        index = frame.row * (sheet.columns || 1) + frame.column,
        baseline = sheet.baselines?.[index] ?? sheet.footY,
        head =
          sheet.headTops?.[index] ??
          sheet.labelTop ??
          baseline - sheet.bodyHeight,
        raise = lift + h * ((baseline - head) / sheet.bodyHeight - 1),
        split = at(x, z).y - unit * (raise + h * 0.45);
      // Keep the real mount and lower body below the waist, with one raised-arm
      // torso above it. This avoids standing on water or drawing two riders.
      const current = saluting;
      saluting = null;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, split, width, height - split);
      ctx.clip();
      sprite(id, x, z, h, d, moving, time, lift, human);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, split);
      ctx.clip();
      sprite(current.asset, x, z, h, 0, true, current.elapsed, raise, false);
      ctx.restore();
      saluting = current;
      return;
    }
    if (human) time = gaitTimeForSheet(sheet, time);
    const p = at(x, z);
    p.y -= lift * unit;
    const scaled =
      sheet.native || sheet.pixelArt
        ? sheet
        : sheet.cw
          ? {
              ...sheet,
              cw: sheet.cw * 0.5,
              ch: sheet.ch * 0.5,
            }
          : sheet;
    ctx.save();
    ctx.imageSmoothingEnabled = !!sheet.smooth || !sheet.pixelArt;
    ctx.imageSmoothingQuality = "high";
    drawSprite(
      ctx,
      img,
      scaled,
      Math.round(p.x),
      Math.round(p.y),
      Math.round(
        h * unit * (sheet.bodyHeight ? sheet.ch / sheet.bodyHeight : 1),
      ),
      d,
      moving,
      time,
    );
    ctx.restore();
  }
  // Use the endpoint in the actual illustrated frame. Drawing another pole
  // over these fishing sheets caused the doubled-rod appearance.
  function fishingTip(actor, elapsed) {
    const id = playerPose(actor),
      sheet = artwork[id];
    if (!sheet?.rodTips) return null;
    const frame = spriteFrame(
      sheet,
      actor.direction,
      true,
      Math.min(elapsed || 0, sheet.frameMs * (sheet.holdFrame ?? 6) + 1),
    );
    const index = frame.row * sheet.columns + frame.column,
      tip = sheet.rodTips[index];
    if (!tip) return null;
    const p = at(actor.x ?? actor.position.x, actor.z ?? actor.position.z),
      scale = (personHeight(actor.character) * unit) / sheet.bodyHeight;
    return {
      x:
        p.x +
        (tip[0] - (sheet.anchors?.[index] ?? sheet.cw / 2)) *
          scale *
          (frame.flip ? -1 : 1),
      y: p.y + (tip[1] - sheet.footY) * scale,
    };
  }
  function drawWatercraft(entry, state) {
    const { craft, ride, driver } = entry,
      time = state.rideTime ?? state.worldTime,
      direction = ride?.direction ?? 0;
    const p = at(entry.x, entry.z),
      moving = !!ride?.moving;
    const angle = (direction * Math.PI) / 4;
    ctx.save();
    ctx.strokeStyle = "#d1f5f0aa";
    ctx.lineWidth = Math.max(1, unit * 0.035);
    if (moving || ride?.splash != null)
      for (let i = 0; i < 3; i++) {
        const t = ride?.splash ?? (time / 800 + i / 3) % 1,
          reach = 0.5 + t * 1.7;
        const wake = at(
          entry.x - Math.sin(angle) * reach,
          entry.z - Math.cos(angle) * reach,
        );
        ctx.globalAlpha = (1 - t) * 0.65;
        ctx.beginPath();
        ctx.ellipse(
          wake.x,
          wake.y - unit * 0.3,
          unit * (0.25 + t * 0.8),
          unit * (0.1 + t * 0.2),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    ctx.globalAlpha = 1;
    const lift = (ride?.lift || 0) + Math.sin(time / 450) * 0.025;
    ctx.translate(p.x, p.y - unit * lift);
    ctx.rotate(ride?.spin || 0);
    ctx.translate(-p.x, -p.y);
    sprite(craft.art, entry.x, entry.z, craft.h, direction, true, time);
    if (ride) {
      ctx.save();
      if (driver.deck != null) {
        const bottom = p.y - unit * driver.deck;
        ctx.beginPath();
        ctx.rect(
          p.x - unit * 4,
          p.y - unit * 7,
          unit * 8,
          bottom - (p.y - unit * 7),
        );
        ctx.clip();
      }
      sprite(
        activityAsset(
          ride.driver || state.character,
          (ride.driver || state.character) === state.character
            ? state.outfit
            : state.residents?.find((r) => r.id === ride.driver)?.outfit,
          "water-ride",
          artwork,
        ),
        entry.x + driver.x,
        entry.z,
        driver.body,
        direction,
        true,
        time,
        driver.lift,
      );
      ctx.restore();
    }
    ctx.restore();
  }
  // Board surfaces and planted feet stay together. A skateboard kickflip turns
  // only the deck; wakeboard flips rotate the rider and board together.
  function drawBoard(entry, state) {
    const p = at(entry.x, entry.z),
      ride = entry.ride;
    ctx.save();
    ctx.translate(p.x, p.y - (ride?.lift || 0) * unit);
    ctx.rotate(entry.wake ? ride?.spin || 0 : 0);
    ctx.translate(-p.x, -p.y);
    ctx.save();
    if (!entry.wake && ride?.deckFlip) {
      ctx.translate(p.x, p.y - unit * 0.15);
      ctx.scale(1, Math.cos(ride.deckFlip));
      ctx.translate(-p.x, -p.y + unit * 0.15);
    }
    sprite(
      entry.wake ? "wakeboard" : "skateboard",
      entry.x,
      entry.z,
      entry.wake ? 0.95 : 0.85,
      ride?.direction ?? (entry.wake ? 0 : 2),
      !!ride,
      state.rideTime ?? state.worldTime,
    );
    ctx.restore();
    if (ride) {
      const outfit = entry.player ? state.outfit : entry.outfit;
      image(activityAsset(entry.id, outfit, "board-trick", artwork));
      image(activityAsset(entry.id, outfit, "wake-ride", artwork));
      const pose = boardPose(
        entry.id,
        ride,
        entry.wake,
        state.rideTime ?? state.worldTime,
        artwork,
        outfit,
      );
      sprite(
        pose.asset,
        entry.x,
        entry.z,
        personHeight(entry.id),
        ride.direction,
        pose.moving,
        pose.time,
        entry.wake ? 0.16 : 0.1,
      );
    }
    ctx.restore();
  }
  function drawPraise(state) {
    const praise = state.oceanPraise;
    if (!praise) return;
    ctx.save();
    ctx.globalAlpha = praise.fade;
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7,
        p = {
          x: praise.x + Math.cos(a) * 2.4,
          z: praise.z + Math.sin(a) * 1.3,
        };
      sprite(
        fishSpecies[i * 3].art,
        p.x,
        p.z,
        0.8,
        i % 2 ? 2 : 6,
        true,
        state.worldTime,
        0.1 + Math.sin(praise.age / 160 + i) * 0.08,
      );
      const atp = at(p.x, p.z);
      ctx.strokeStyle = "#c4f2f3aa";
      ctx.beginPath();
      ctx.ellipse(atp.x, atp.y, unit * 0.45, unit * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (praise.speaking) {
      const p = at(praise.x, praise.z - 2.2);
      ctx.font = "600 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "#f0f4df";
      ctx.beginPath();
      ctx.roundRect(p.x - 83, p.y - 27, 166, 35, 10);
      ctx.fill();
      ctx.fillStyle = "#173c45";
      ctx.fillText("we worship thee", p.x, p.y - 5);
    }
    ctx.restore();
  }
  function rect(x, z, w, h, color) {
    const p = at(x, z);
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(p.x),
      Math.round(p.y),
      Math.ceil(w * unit),
      Math.ceil(h * unit),
    );
  }
  function draw(state, time) {
    const saluteBase = characterAsset(state.character, state.outfit);
    saluting = state.salute
      ? {
          base: saluteBase,
          asset: saluteBase + "-salute",
          elapsed: state.salute.elapsed,
        }
      : null;
    room = state.room;
    zoom = room ? roomZoom : townZoom;
    // Zooming all the way out frames the entire island rather than cutting off
    // the far fence. Close views continue to follow the controlled character.
    const overview = room ? 0 : Math.max(0, Math.min(1, (0.45 - zoom) / 0.2));
    viewY = 0.55 - overview * 0.05;
    const cameraPosition =
      abilityActive(state.abilityEffect, state.worldTime) &&
      state.abilityEffect.kind === "glide"
        ? state.abilityEffect
        : state.position;
    focus = {
      x: cameraPosition.x * (1 - overview),
      z: (cameraPosition.z - 1) * (1 - overview) + 0.5 * overview,
    };
    unit =
      (room
        ? Math.max(13, Math.min(width / 27, height / 22))
        : Math.max(width < 600 ? 28 : 13, Math.min(width / 25, height / 17))) *
      zoom;
    if (state.axolotlRace) {
      // Frame all five lanes on phones and wide monitors without overwriting
      // the visitor's normal zoom preference. The pier view returns afterward.
      focus = { x: raceView.x, z: raceView.z };
      viewY = 0.55;
      unit = Math.max(
        1,
        Math.min(
          (width - 32) / raceView.width,
          (height - (height < 600 ? 220 : 300)) / raceView.height,
        ),
      );
    }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = room ? "#38485a" : "#86b969";
    ctx.fillRect(0, 0, width, height);
    labels = [];
    const sceneSprites = [];
    if (room) {
      // Clip all floor/art to the room. Negative modulo used to place alternating
      // seams at x=-13.5, outside the room, leaving stray pixels in the gray margin.
      ctx.save();
      ctx.beginPath();
      const edge = at(-roomBounds.halfWidth, roomBounds.back);
      ctx.rect(
        edge.x,
        edge.y,
        roomBounds.halfWidth * 2 * unit,
        (roomBounds.front - roomBounds.back) * unit,
      );
      ctx.clip();
      // A broad walkable floor surrounds the original interior art. Keep its true aspect
      // ratio instead of squeezing every source image into the same narrow rectangle.
      rect(
        -roomBounds.halfWidth,
        roomBounds.back,
        roomBounds.halfWidth * 2,
        roomBounds.front - roomBounds.back,
        "#a88760",
      );
      for (let z = roomBounds.back; z < roomBounds.front; z += 0.65) {
        rect(
          -roomBounds.halfWidth,
          z,
          roomBounds.halfWidth * 2,
          0.035,
          "#8d6c4b",
        );
        for (let x = -12; x < 12; x += 3)
          rect(
            x + (((Math.round(z / 0.65) % 2) + 2) % 2) * 1.5,
            z,
            0.025,
            0.65,
            "#95724f",
          );
      }
      const id = "interior-" + room;
      const img = image(id);
      if (img) {
        const p = at(-12.5, roomBounds.back);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(
          img,
          p.x,
          p.y,
          25 * unit,
          (25 * unit * img.height) / img.width,
        );
      }
      rect(-12.5, roomBounds.back, 0.18, 20, "#5b5b60");
      rect(12.32, roomBounds.back, 0.18, 20, "#5b5b60");
      ctx.restore();
    } else {
      terrain.draw(ctx, at, unit, time);
      drawFootprints(ctx, at, unit, state);
      sceneSprites.push(...beachSprites(state));
      if (state.axolotlRace) drawRaceCourse(ctx, at, unit, time);
      for (const b of buildings) {
        sceneSprites.push({
          art: "building-" + b.id,
          x: b.x,
          z: b.z + 3.1,
          h: buildingHeight(b),
          building: true,
        });
        const p = at(b.x, b.z + 2.8 - buildingHeight(b));
        labels.push({
          id: b.id,
          title: b.title,
          x: p.x,
          y: p.y,
          visible: p.x > 0 && p.x < width && p.y > 24 && p.y < height,
        });
      }
    }

    const sprites = sceneSprites;
    if (!room)
      for (const [art, x, z, h] of [
        ...townDecor,
        [
          axolotlRaceMarker.art,
          axolotlRaceMarker.x,
          axolotlRaceMarker.z,
          axolotlRaceMarker.h,
        ],
        ...townProps.map((p) => ["town-" + p.id, p.x, p.z, p.h]),
      ])
        if (artwork[art])
          sprites.push({
            art,
            x:
              state.treeShake &&
              state.treeShake.x === x &&
              state.treeShake.z === z
                ? x +
                  Math.sin((state.worldTime - state.treeShake.started) / 40) *
                    0.12
                : x,
            z: art.includes("boat") ? z + Math.sin(time / 1200 + x) * 0.06 : z,
            h:
              state.grove && x === groveTree.x && z === groveTree.z
                ? h * (1 + state.grove.growth * 0.72)
                : h,
          });
    if (!room) {
      // The mask peeks out on the right. The actual tree still covers the robe.
      const peek = (1 - Math.cos(state.worldTime / 1250)) / 2;
      sprites.push({
        art: "no-face",
        x: windfallTree.x + 0.84 + peek * 0.9,
        z: windfallTree.z + 0.14,
        sortZ: windfallTree.z - 0.01,
        h: 1.85,
      });
      for (const spirit of groveSpirits(state.grove))
        sprites.push({ ...spirit, groveSpirit: true });

      for (const r of state.residents || residents)
        if (r.id !== state.character && !r.room && !r.hidden)
          sprites.push({
            ...r,
            art: r.frog
              ? "trick-frog"
              : playerPose({
                  character: r.id,
                  outfit: r.outfit,
                  surfing: r.surfing,
                  action: r.action,
                  bikeRide: r.bike ? { id: r.bike, phase: "riding" } : null,
                }),
            h: r.frog ? 0.95 : personHeight(r.id),
            moving: r.frog || r.moving || !!r.action,
            time: r.frog ? state.worldTime : r.time,
          });
      for (const a of state.animals || animals)
        sprites.push({
          ...a,
          art: a.art || (a.kind === "dog" ? a.id : "duck"),
          h: animalHeight(a),
        });
    }
    if (!room)
      for (const b of bikes) {
        if (
          (state.bikeRide?.phase === "riding" && state.bikeRide.id === b.id) ||
          state.residents?.some(
            (r) => r.id !== state.character && r.bike === b.id,
          )
        )
          continue;
        sprites.push({
          ...b,
          h: bikeHeight,
          direction: state.bikeParking?.[b.id] ?? 6,
          moving: false,
        });
      }
    const costume = playerPose(state);
    if (artwork[costume]?.action === "walk") {
      if (artwork[costume + "-run"]) image(costume + "-run");
      if (artwork[costume + "-conduct"]) image(costume + "-conduct");
    }
    image(saluteBase + "-salute");
    const glide = glideVisual(state.abilityEffect, state.worldTime);
    const cycling = state.bikeRide?.phase === "riding";
    const acting =
      abilityActive(state.abilityEffect, state.worldTime) &&
      !!state.abilityEffect.asset;
    const waterRide =
      state.waterRide && !state.waterRide.done ? state.waterRide : null;
    if (!room)
      for (const craft of watercraft) {
        const ride =
          (waterRide?.craftId || waterRide?.id) === craft.id ? waterRide : null;
        const heading = ride?.direction ?? 0;
        const body = personHeight(ride?.driver || state.character) * 0.9;
        const cockpit = craft.cockpit?.[heading];
        const driver = {
          x: cockpit?.x ?? -Math.sin((heading * Math.PI) / 4) * 0.12,
          deck: cockpit?.deck,
          body,
          lift: cockpit
            ? cockpit.deck - body * 0.36
            : jetSkiSeatHeights[heading],
        };
        sprites.push({
          id: ride ? ride.driver || state.character : craft.id,
          watercraft: true,
          craft,
          ride,
          driver,
          x: ride?.x ?? craft.x,
          z: ride?.z ?? craft.z,
          h: driver.body + driver.lift,
          lift: ride?.lift || 0,
          player:
            !!ride && (ride.driver || state.character) === state.character,
        });
      }
    const surfer =
      state.surfRide && !state.surfRide.done ? state.surfRide : null;
    if (!room)
      sprites.push({
        id: surfer ? state.character : "surfboard",
        surfboard: true,
        ride: surfer,
        x: surfer?.x ?? surfboard.x,
        z: surfer?.z ?? surfboard.z,
        h: surfer ? personHeight(state.character) : 2.4,
        player: !!surfer,
      });
    const skateRide =
      state.skateRide && !state.skateRide.done ? state.skateRide : null;
    if (!room) {
      sprites.push({
        id: skateRide ? state.character : "skateboard",
        board: true,
        ride: skateRide,
        x: skateRide?.x ?? skateboard.x,
        z: skateRide?.z ?? skateboard.z,
        h: personHeight(state.character),
        lift: skateRide?.lift || 0,
        player: !!skateRide,
      });
      const guest = waterRide?.wakeboarder;
      if (guest) {
        const a = at(waterRide.x, waterRide.z),
          b = at(guest.x, guest.z);
        ctx.save();
        ctx.strokeStyle = "#e8e5b9";
        ctx.lineWidth = Math.max(1, unit * 0.03);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - unit * 0.3);
        ctx.lineTo(b.x, b.y - unit * (1 + guest.lift));
        ctx.stroke();
        ctx.restore();
        sprites.push({
          ...guest,
          board: true,
          wake: true,
          ride: guest,
          h: personHeight(guest.id),
          player: guest.id === state.character,
        });
      }
    }
    if (!room)
      for (const spot of restSpots)
        sprites.push({
          ...spot,
          restSpot: true,
          player: state.rest?.id === spot.id,
        });
    if (!waterRide && !skateRide && !surfer && !state.rest)
      sprites.push({
        id: state.character,
        ...state.position,
        art: costume,
        h: personHeight(state.character),
        direction: state.salute
          ? 0
          : (glide?.direction ??
            (acting ? state.abilityEffect.direction : state.direction)),
        lift:
          glide?.lift ??
          runningLift(artwork[costume], state.moving, state.gaitTime),
        moving:
          !!state.salute ||
          acting ||
          state.moving ||
          !!state.action ||
          state.surfing ||
          state.grove?.playerFrame != null ||
          !!state.beach?.building,
        time:
          state.grove?.playerFrame != null
            ? state.grove.playerFrame * (artwork[costume]?.frameMs || 95)
            : state.salute
              ? cycling
                ? state.bikeRide.time
                : state.surfing
                  ? 0
                  : state.salute.elapsed
              : state.beach?.building
                ? [0, 1, 2, 1][Math.floor(state.worldTime / 230) % 4] *
                  (artwork[costume]?.frameMs || 95)
                : cycling
                  ? state.bikeRide.time
                  : glide
                    ? glide.frame * artwork[costume].frameMs
                    : acting
                      ? abilityColumn(state.abilityEffect, state.worldTime) *
                        artwork[costume].frameMs
                      : state.action === "fish"
                        ? Math.min(
                            state.fishingElapsed || 0,
                            (artwork[costume]?.frameMs || 160) *
                              (artwork[costume]?.holdFrame ?? 3) +
                              1,
                          )
                        : state.action || state.surfing
                          ? time
                          : state.gaitTime,
        player: true,
      });
    // Ducks keep their own familiar sheet on both terrains; a soft wake makes
    // swimming clear without a second sprite or a hard position jump.
    for (const a of sprites.filter(
      (a) => ["duck", "goose"].includes(a.kind) && a.inWater,
    )) {
      const p = at(a.x, a.z);
      ctx.save();
      ctx.strokeStyle = "#d0f7f285";
      ctx.lineWidth = Math.max(1, unit * 0.035);
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y - unit * 0.04,
        unit * 0.44,
        unit * 0.13,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
    if (glide) {
      const p = at(state.position.x, state.position.z);
      ctx.save();
      ctx.fillStyle = "#123b3e3d";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, unit * 0.65, unit * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (!room) {
      // Some illustrated doors are inset above the building's bottom edge.
      // Their mailboxes keep the real doorway position but paint in front of
      // their own home, so the facade cannot swallow the entire mailbox.
      for (const box of mailboxes) {
        const home = buildings.find((b) => b.id === box.home);
        sprites.push({ ...box, sortZ: Math.max(box.z, home.z + 3.2) });
      }
    }
    for (const a of sprites.sort((a, b) => {
      const depth = (p) => {
        if (p.sortZ !== undefined) return p.sortZ;
        if (p.building) return p.z;
        const door = buildings.find(
          (b) => Math.abs(p.x - b.x) < 0.95 && p.z > b.z + 0.2 && p.z < b.z + 5,
        );
        return door ? door.z + 3.15 : p.z;
      };
      return depth(a) - depth(b);
    }))
      if (!a.hidden && (!a.player || flight <= time))
        if (a.groveSpirit)
          drawGroveSpirit(ctx, at, unit, image("totoro-grove"), a);
        else if (a.restSpot) drawRestSpot(a, state);
        else if (a.watercraft) drawWatercraft(a, state);
        else if (a.board) drawBoard(a, state);
        else if (a.surfboard) drawSurfer(a, state);
        else
          sprite(
            a.art,
            a.x,
            a.z,
            a.h,
            a.direction || 0,
            a.moving,
            a.time ?? time,
            (a.lift || 0) + (a.player ? state.grove?.bounce || 0 : 0),
            humanIds.has(a.id),
          );
    if (!room) {
      for (const bird of skyBirds(
        state.skyTime ?? state.worldTime,
        state.position,
      ))
        sprite(
          bird.art,
          bird.x,
          bird.z,
          bird.h,
          bird.direction,
          true,
          bird.time,
          bird.lift,
        );
      drawGroveLights(ctx, at, unit, state.grove);
      drawPraise(state);
      drawBeachActivities(ctx, at, unit, state, sprite);
    }
    drawWindSong(ctx, at, unit, state, personHeight(state.character));
    drawPassing(ctx, width, height, state.night, time);
    drawTricks(ctx, at, unit, state.npcTricks, personHeight);
    ctx.save();
    ctx.font = "500 11px system-ui";
    ctx.textAlign = "center";
    for (const a of sprites) {
      const person = characters.find(
        (c) => c.id === (a.restSpot && a.player ? state.character : a.id),
      );
      if (!person || a.building || a.hidden || (a.player && flight > time))
        continue;
      const name = person.name,
        p = at(a.x + (a.driver?.x ?? 0), a.z),
        sheet = artwork[a.art],
        // A child sits higher on the full-size rental. Keep their name above
        // the actual head instead of placing it at their standing height.
        labelHeight =
          sheet?.labelTop != null
            ? (a.h * (sheet.footY - sheet.labelTop)) / sheet.bodyHeight
            : a.h,
        y = p.y - unit * (labelHeight + (a.lift || 0)) - 8;
      const w = ctx.measureText(name).width + 14;
      ctx.fillStyle = "#122b30cc";
      ctx.beginPath();
      ctx.roundRect(p.x - w / 2, y - 12, w, 19, 6);
      ctx.fill();
      ctx.fillStyle = "#edf3e6";
      ctx.fillText(name, p.x, y + 1);
    }
    ctx.restore();
    drawActivities(ctx, at, unit, state);
    if (!room)
      for (const resident of state.residents || []) {
        if (
          resident.id !== state.character &&
          resident.action === "fish" &&
          !resident.hidden &&
          !resident.frog &&
          !resident.room
        )
          drawFishingLine(
            ctx,
            at,
            unit,
            resident,
            resident.fishingTarget,
            resident.fishingElapsed,
            "waiting",
            resident.surfing,
            personHeight(resident.id),
            fishingTip(
              { ...resident, character: resident.id },
              resident.fishingElapsed,
            ),
          );
      }
    if (state.action === "fish" && !state.salute)
      drawFishingLine(
        ctx,
        at,
        unit,
        state.position,
        state.fishingTarget,
        state.fishingElapsed,
        state.fishingPhase,
        state.surfing,
        personHeight(state.character),
        fishingTip(state, state.fishingElapsed),
      );
    if (state.heart) {
      const p = at(state.heart.x, state.heart.z),
        age = Math.max(0, time - state.heart.born);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - age / 1400);
      ctx.fillStyle = "#f7a1b2";
      for (let i = 0; i < 3; i++) {
        ctx.font = `${Math.round(unit * (0.28 + i * 0.04))}px sans-serif`;
        ctx.fillText(
          "♥",
          p.x + (i - 1) * unit * 0.38,
          p.y - unit * (2.5 + age / 1100 + i * 0.2),
        );
      }
      ctx.restore();
    }
    if (flight > time) {
      const duration = flightMode === "out" ? flyDepartureMs : flyArrivalMs;
      const elapsed = time - (flight - duration),
        f = flightFrame(flightMode, elapsed);
      const p = at(state.position.x, state.position.z),
        h = personHeight(state.character),
        appearance = flightAppearance(state.character, state.outfit);
      if (f.player) {
        const action =
          f.phase === "turn" || f.phase === "pickup"
            ? "call"
            : f.phase === "release"
              ? state.surfing
                ? "surf"
                : "land"
              : null;
        const id = appearance.layered
          ? appearance.body
          : action && artwork[state.character + "-" + action]
            ? state.character + "-" + action
            : costume;
        const local =
          f.phase === "release"
            ? Math.max(0, elapsed - flyArrivalMs * 0.62)
            : elapsed;
        const frameTime =
          action === "land"
            ? Math.min(
                (artwork[id]?.frameMs || 100) * (artwork[id]?.columns || 4) - 1,
                local,
              )
            : local;
        sprite(
          id,
          state.position.x,
          state.position.z,
          h,
          f.direction,
          !!action,
          frameTime,
        );
      }
      const releasingOnDuck =
        !appearance.layered &&
        !state.surfing &&
        f.phase === "release" &&
        elapsed - flyArrivalMs * 0.62 <
          ((artwork[state.character + "-land"]?.columns || 4) / 2) *
            (artwork[state.character + "-land"]?.frameMs || 100);
      if (f.bird && !releasingOnDuck) {
        const bx = p.x + f.x * width * 0.55,
          by = p.y + f.y * height * 0.75;
        const rider = appearance.rider;
        const layered = !f.player && appearance.layered;
        const id = !f.player && !layered ? rider : "duck-flight",
          sheet = artwork[id],
          img = image(id);
        ctx.fillStyle = `rgba(23,36,41,${0.22 * f.shadow})`;
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y,
          unit * 0.7 * f.shadow,
          unit * 0.2 * f.shadow,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        if (img && sheet) {
          ctx.save();
          ctx.translate(bx, by - unit * 0.5);
          ctx.rotate(f.angle);
          if (layered) {
            const body = artwork[appearance.body],
              bodyImage = image(appearance.body);
            if (bodyImage && body) {
              ctx.save();
              ctx.imageSmoothingEnabled = !!body.smooth;
              // The duck's foreground covers the lower legs, keeping a seated silhouette.
              ctx.beginPath();
              ctx.rect(-unit * 2, -unit * 4, unit * 4, unit * 3.05);
              ctx.clip();
              drawSprite(
                ctx,
                bodyImage,
                body,
                -unit * 0.12,
                -unit * 0.75,
                (unit * h * 0.76 * body.ch) / body.bodyHeight,
                2,
                false,
                0,
              );
              ctx.restore();
            }
          }
          drawSprite(
            ctx,
            img,
            sheet,
            0,
            0,
            (unit * (!f.player && !layered ? h * 0.94 : 1.35) * sheet.ch) /
              (sheet.bodyHeight || sheet.ch),
            2,
            true,
            elapsed,
          );
          ctx.restore();
        }
      }
      if (f.fade) {
        ctx.fillStyle = `rgba(9,16,24,${f.fade})`;
        ctx.fillRect(0, 0, width, height);
      }
      canvas.dataset.flightPhase = f.phase;
      canvas.dataset.flightCostume = appearance.body;
      canvas.dataset.flightMount = "duck";
    } else canvas.dataset.flightPhase = "idle";
    if (holdingFade) {
      ctx.fillStyle = "#091018";
      ctx.fillRect(0, 0, width, height);
    }
    canvas.dataset.residentActivities = JSON.stringify(
      (state.residents || [])
        .filter((r) => r.id !== state.character)
        .map((r) => ({ id: r.id, activity: r.activity, bike: r.bike })),
    );
    canvas.dataset.surfingResidents = JSON.stringify(
      (state.residents || [])
        .filter((r) => r.id !== state.character && r.surfing)
        .map((r) => r.id),
    );
    canvas.dataset.duckActivity =
      state.duckPlay && !state.duckPlay.done ? state.duckPlay.kind : "idle";
    canvas.dataset.ducks = JSON.stringify(
      (state.animals || [])
        .filter((a) => a.kind === "duck")
        .map((a) => ({
          id: a.id,
          x: a.x,
          z: a.z,
          inWater: a.inWater,
        })),
    );
    canvas.dataset.dogActivity =
      state.dogPlay && !state.dogPlay.done ? state.dogPlay.kind : "idle";
    canvas.dataset.bikeRide = state.bikeRide?.phase || "idle";
    canvas.dataset.waterRide =
      state.waterRide && !state.waterRide.done ? state.waterRide.id : "idle";
    canvas.dataset.skateRide =
      state.skateRide && !state.skateRide.done ? state.skateRide.phase : "idle";
    canvas.dataset.oceanPraise = state.oceanPraise?.speaking
      ? "speaking"
      : "idle";
    canvas.dataset.waterTrick = state.waterRide?.trick || "idle";
    canvas.dataset.glidePhase = glide?.phase || "idle";
    canvas.dataset.npcTricks = JSON.stringify(state.npcTricks || []);
    canvas.dataset.night = (state.night || 0).toFixed(2);
    canvas.dataset.abilityEffect = abilityActive(
      state.abilityEffect,
      state.worldTime,
    )
      ? state.abilityEffect.kind
      : "idle";
    canvas.dataset.visitingResidents = JSON.stringify(
      (state.residents || [])
        .filter((r) => r.room)
        .map((r) => ({
          id: r.id,
          room: r.room,
        })),
    );
    canvas.dataset.webEffects = String(state.webEffects?.length || 0);
    canvas.dataset.renderer = "pixel-art";
    canvas.dataset.zoom = zoom.toFixed(2);
    canvas.dataset.character = state.character;
    canvas.dataset.pose = costume;
    canvas.dataset.outfit = state.outfit || "everyday";
    canvas.dataset.fishingPhase = state.fishingPhase || "idle";
    canvas.dataset.surfing = String(!!state.surfing);
    canvas.dataset.direction = String(state.direction);
    canvas.dataset.moving = String(state.moving);
    canvas.dataset.salute = state.salute ? String(state.salute.frame) : "idle";
    canvas.dataset.skyTime = String(Math.floor(state.skyTime || 0));
    canvas.dataset.room = state.room || "town";
    canvas.dataset.inputTrace = JSON.stringify(state.inputTrace);
    canvas.dataset.playerX = state.position.x.toFixed(2);
    canvas.dataset.playerZ = state.position.z.toFixed(2);
  }
  async function loadTown() {
    // Longer character atlases are decoded only when their action/costume is
    // visible. Phones need the town and family first, not every possible pose.
    const initialPeople = new Set(characters.map((person) => person.id));
    await Promise.all(
      Object.keys(artwork)
        .filter(
          (id) =>
            !id.startsWith("interior-") &&
            (!artwork[id].src?.startsWith("/world/games/") ||
              ["trainer-stool", "seahorse-rocker"].includes(id)) &&
            !bugArt.has(id) &&
            !id.startsWith("fish-") &&
            (!artwork[id].detailVersion || initialPeople.has(id)),
        )
        .map((id) => art.load(id)),
    );
    invalidate();
  }
  return {
    canvas,
    draw,
    loadTown,
    labels: () => labels,
    resize() {
      width = host.clientWidth || window.innerWidth;
      height = host.clientHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    },
    loadRoom: async (id) => {
      await art.load("interior-" + id);
    },
    hit(x, y) {
      const r = canvas.getBoundingClientRect();
      return {
        x: (x - r.left - width / 2) / unit + focus.x,
        z: (y - r.top - height * viewY) / unit + focus.z,
      };
    },
    movement: (dx, dz) => ({
      dx,
      dz,
    }),
    facing: (x, z) => ({
      x,
      z,
    }),
    speedScale: () => 1,
    animating: () => true,
    snapCamera(p) {
      focus = {
        ...p,
      };
    },
    setZoom(delta) {
      zoom = Math.max(0.25, Math.min(3, zoom + delta));
      if (room) roomZoom = zoom;
      else townZoom = zoom;
      invalidate();
    },
    holdFade(value) {
      holdingFade = value;
      invalidate();
    },
    cancelFly() {
      holdingFade = false;
      flight = 0;
      invalidate();
    },
    fly(mode = "in") {
      flightMode = mode;
      flight =
        performance.now() + (mode === "out" ? flyDepartureMs : flyArrivalMs);
      invalidate();
    },
    dispose() {
      disposed = true;
      pixels.clear();
      requested.clear();
      terrain.dispose();
      art.clear();
      canvas.remove();
    },
  };
}
